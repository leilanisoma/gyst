import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import {
  validateActionArguments,
  type CreateGoalActionSchema,
  type CreateTaskActionSchema,
  type UpdateTaskActionSchema,
} from "./action-schemas";

export type ApproveActionResult = { ok: true } | { ok: false; error: string };

/**
 * The only place a `propose_action` proposal ever becomes a real write
 * (PLAN.md §12/§14 "must never ... write ... without explicit approval").
 * Re-validates `arguments` against the same Zod schema `propose_action`
 * used to create the preview — never trusts a stored payload just because
 * it was already validated once (task 8.6 defense in depth). Requires
 * status 'proposed', so calling this twice on the same action, or after
 * `rejectAssistantAction`, is a no-op rather than a double-write.
 *
 * Pulled out of `src/app/(app)/chat/actions.ts`'s "use server" action so it
 * can be unit-tested directly (same split as `src/lib/canvas/sync.ts` vs.
 * its thin action wrapper) — the wrapper just does the auth check and
 * `revalidatePath`.
 */
export async function approveAssistantAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionId: string,
): Promise<ApproveActionResult> {
  const { data: action, error: fetchError } = await supabase
    .from("assistant_actions")
    .select("id, action_type, arguments, status")
    .eq("id", actionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (fetchError || !action) {
    return { ok: false, error: fetchError?.message ?? "Action not found." };
  }
  if (action.status !== "proposed") {
    return { ok: false, error: `This action is already ${action.status}.` };
  }

  const validated = validateActionArguments(
    action.action_type,
    action.arguments,
  );
  if (!validated.ok) {
    await supabase
      .from("assistant_actions")
      .update({ status: "failed", error: validated.error })
      .eq("id", actionId);
    return { ok: false, error: validated.error };
  }

  const executed = await executeApprovedAction(
    supabase,
    userId,
    action.action_type,
    validated.data,
  );
  if (!executed.ok) {
    await supabase
      .from("assistant_actions")
      .update({ status: "failed", error: executed.error })
      .eq("id", actionId);
    return { ok: false, error: executed.error };
  }

  await supabase
    .from("assistant_actions")
    .update({ status: "executed", result: executed.result as never })
    .eq("id", actionId);
  return { ok: true };
}

export async function rejectAssistantAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionId: string,
): Promise<ApproveActionResult> {
  const { error } = await supabase
    .from("assistant_actions")
    .update({ status: "rejected" })
    .eq("id", actionId)
    .eq("user_id", userId)
    .eq("status", "proposed");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

type ExecuteResult =
  { ok: true; result: Record<string, unknown> } | { ok: false; error: string };

async function executeApprovedAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionType: string,
  args: unknown,
): Promise<ExecuteResult> {
  if (actionType === "create_task") {
    const input = args as z.infer<typeof CreateTaskActionSchema>;
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: input.title,
        notes: input.notes ?? null,
        area: input.area ?? "general",
        priority: input.priority ?? "medium",
        due_date: input.dueDate ?? null,
        estimated_minutes: input.estimatedMinutes ?? null,
        source: "assistant",
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, result: { taskId: data.id } };
  }

  if (actionType === "update_task") {
    const input = args as z.infer<typeof UpdateTaskActionSchema>;
    const updates: Record<string, unknown> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.status !== undefined) updates.status = input.status;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.dueDate !== undefined) updates.due_date = input.dueDate;
    if (Object.keys(updates).length === 0) {
      return { ok: false, error: "No fields to update." };
    }
    const { error } = await supabase
      .from("tasks")
      .update(updates as never)
      .eq("id", input.taskId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, result: { taskId: input.taskId } };
  }

  if (actionType === "create_goal") {
    const input = args as z.infer<typeof CreateGoalActionSchema>;
    const { data, error } = await supabase
      .from("goals")
      .insert({ user_id: userId, title: input.title })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, result: { goalId: data.id } };
  }

  return { ok: false, error: `Unknown action type "${actionType}".` };
}
