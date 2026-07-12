"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./actions";

export type OpportunityFeedback = "up" | "down" | "not_relevant";

/**
 * Thumbs up/down/not relevant (PLAN.md §15 Phase 5 task 5.6). Up/down feed
 * straight into the same `user_feedback_score` dimension the score-edit form
 * already exposes, then recompute `total_score` the same way that form
 * does. "Not relevant" additionally archives the application so it drops
 * out of the discovery queue instead of resurfacing every day the source
 * still lists it (re-ingestion only touches `last_seen_at`/`active`, never
 * `stage` or `feedback`, once an opportunity already exists).
 */
export async function setOpportunityFeedback(
  applicationId: string,
  opportunityId: string,
  feedback: OpportunityFeedback,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: score, error: scoreError } = await supabase
    .from("job_scores")
    .select(
      "role_family_score, skills_experience_score, eligibility_score, interest_industry_score, established_company_score, deadline_urgency_score, user_feedback_score, excluded",
    )
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  if (scoreError || !score) {
    return { ok: false, error: "Score not found." };
  }

  const userFeedbackScore = feedback === "up" ? 5 : feedback === "down" ? 0 : score.user_feedback_score;
  const total = score.excluded
    ? 0
    : score.role_family_score +
      score.skills_experience_score +
      score.eligibility_score +
      score.interest_industry_score +
      score.established_company_score +
      score.deadline_urgency_score +
      userFeedbackScore;

  const { error: opportunityError } = await supabase
    .from("opportunities")
    .update({ feedback })
    .eq("id", opportunityId);
  if (opportunityError) {
    return { ok: false, error: opportunityError.message };
  }

  const { error: updateScoreError } = await supabase
    .from("job_scores")
    .update({ user_feedback_score: userFeedbackScore, total_score: total })
    .eq("opportunity_id", opportunityId);
  if (updateScoreError) {
    return { ok: false, error: updateScoreError.message };
  }

  if (feedback === "not_relevant") {
    const { error: applicationError } = await supabase
      .from("applications")
      .update({ stage: "archived" })
      .eq("id", applicationId);
    if (applicationError) {
      return { ok: false, error: applicationError.message };
    }
    await supabase.from("application_events").insert({
      application_id: applicationId,
      from_stage: "discovered",
      to_stage: "archived",
    });
  }

  revalidatePath("/recruiting");
  return { ok: true };
}
