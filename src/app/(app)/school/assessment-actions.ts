"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, AssessmentKind, AssessmentPreparationStatus } from "@/lib/assessments";
import { createMilestoneSuggestions } from "@/lib/milestones";

/**
 * Confirms a Canvas/syllabus-derived candidate as a real assessment
 * (PLAN.md §15 task 6.4). Confirmation is also the trigger point for task
 * 6.7's milestone suggestions on the "major" kinds (final/midterm/project/
 * presentation) — a candidate isn't real until confirmed, so suggesting
 * prep checkpoints any earlier would be presumptuous.
 */
export async function confirmAssessmentCandidate(assessmentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: assessment, error: fetchError } = await supabase
    .from("assessments")
    .select("id, title, kind, scheduled_at")
    .eq("id", assessmentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchError || !assessment) {
    return { ok: false, error: fetchError?.message ?? "Assessment not found." };
  }

  const { error } = await supabase
    .from("assessments")
    .update({ confirmed: true })
    .eq("id", assessmentId);
  if (error) return { ok: false, error: error.message };

  if (assessment.scheduled_at) {
    await createMilestoneSuggestions(
      supabase,
      user.id,
      {
        title: assessment.title,
        dueAt: assessment.scheduled_at,
        assessmentKind: assessment.kind as AssessmentKind,
        assessmentId: assessment.id,
      },
      new Date(),
    );
  }

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
