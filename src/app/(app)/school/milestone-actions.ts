"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/assessments";

/** Accepting a suggestion is the approval step (PLAN.md's suggestions-not-silent-actions principle) that creates the real task. */
export async function acceptMilestoneSuggestion(suggestionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: suggestion, error: fetchError } = await supabase
    .from("milestone_suggestions")
    .select("id, title, due_date, status")
    .eq("id", suggestionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchError || !suggestion) {
    return { ok: false, error: fetchError?.message ?? "Suggestion not found." };
  }
  if (suggestion.status !== "proposed") {
    return { ok: false, error: "Already reviewed." };
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: suggestion.title,
      area: "school",
      status: "not_started",
      priority: "medium",
      due_date: suggestion.due_date,
      source: "milestone",
    })
    .select("id")
    .single();
  if (taskError || !task) {
    return { ok: false, error: taskError?.message ?? "Failed to create task." };
  }

  const { error: updateError } = await supabase
    .from("milestone_suggestions")
    .update({ status: "accepted", created_task_id: task.id })
    .eq("id", suggestionId);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/school");
  revalidatePath("/");
  return { ok: true };
}

export async function dismissMilestoneSuggestion(suggestionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("milestone_suggestions")
    .update({ status: "dismissed" })
    .eq("id", suggestionId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/school");
  return { ok: true };
}
