import { z } from "zod";
import { TASK_AREAS, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks";

/**
 * One Zod schema per `assistant_actions.action_type` (PLAN.md §12 "propose
 * actions with a preview" / §14 "must never send... without explicit
 * approval"). Shared by `propose_action` (src/lib/chat/tools/actions.ts,
 * validates before creating the preview row) and the approval path
 * (src/app/(app)/chat/actions.ts, re-validates before executing — never
 * trusts a stored `arguments` payload just because it was proposed). Adding
 * a new action type means adding a schema here AND a matching case in
 * both call sites, one at a time, deliberately — not a generic passthrough.
 */
export const CreateTaskActionSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional(),
  area: z.enum(TASK_AREAS).optional(),
  priority: z
    .enum(TASK_PRIORITIES as unknown as [string, ...string[]])
    .optional(),
  dueDate: z.string().optional(),
  estimatedMinutes: z.number().optional(),
});

export const UpdateTaskActionSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).optional(),
  status: z.enum(TASK_STATUSES as unknown as [string, ...string[]]).optional(),
  priority: z
    .enum(TASK_PRIORITIES as unknown as [string, ...string[]])
    .optional(),
  dueDate: z.string().nullable().optional(),
});

export const CreateGoalActionSchema = z.object({
  title: z.string().min(1),
});

export const ACTION_SCHEMAS = {
  create_task: CreateTaskActionSchema,
  update_task: UpdateTaskActionSchema,
  create_goal: CreateGoalActionSchema,
} as const;

export type ActionType = keyof typeof ACTION_SCHEMAS;

export const ACTION_TYPES = Object.keys(ACTION_SCHEMAS) as ActionType[];

export function validateActionArguments(
  actionType: string,
  args: unknown,
): { ok: true; data: unknown } | { ok: false; error: string } {
  const schema = ACTION_SCHEMAS[actionType as ActionType];
  if (!schema) {
    return { ok: false, error: `Unknown action type "${actionType}".` };
  }
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }
  return { ok: true, data: parsed.data };
}
