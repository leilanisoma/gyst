"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, AssessmentPreparationStatus } from "@/lib/assessments";

/** Confirms a Canvas/syllabus-derived candidate as a real assessment (PLAN.md §15 task 6.4). */
export async function confirmAssessmentCandidate(assessmentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessments")
    .update({ confirmed: true })
    .eq("id", assessmentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/school");
  return { ok: true };
}

/** Sticky rejection — `dismissed_at` stops the next Canvas sync from recreating the same candidate. */
export async function dismissAssessmentCandidate(assessmentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessments")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", assessmentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/school");
  return { ok: true };
}

export async function updateAssessmentPreparationStatus(
  assessmentId: string,
  status: AssessmentPreparationStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessments")
    .update({ preparation_status: status })
    .eq("id", assessmentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/school");
  return { ok: true };
}
