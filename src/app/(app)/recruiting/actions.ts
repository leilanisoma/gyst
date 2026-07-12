"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  opportunityFingerprint,
  type ApplicationStage,
  type RoleFamily,
} from "@/lib/recruiting";
import { buildJobScoreRow, scoreOpportunity } from "@/lib/job-scoring";
import { findOrCreateCompany } from "@/lib/companies";
import { getTargetGradYear } from "@/lib/recruiting-preferences";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateOpportunityInput = {
  companyName: string;
  title: string;
  location: string | null;
  description: string | null;
  url: string | null;
  roleFamily: RoleFamily;
  isSwe: boolean;
  isFinance: boolean;
  eligibleGradYears: number[];
  deadline: string | null;
  established: boolean;
};

export async function createOpportunity(
  input: CreateOpportunityInput,
): Promise<ActionResult> {
  const companyName = input.companyName.trim();
  const title = input.title.trim();
  if (!companyName || !title) {
    return { ok: false, error: "Company and title are required." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const company = await findOrCreateCompany(
    supabase,
    user.id,
    companyName,
    input.established,
  );
  if ("error" in company) {
    return { ok: false, error: company.error };
  }
  const companyId = company.id;

  const fingerprint = opportunityFingerprint({
    companyName,
    title,
    url: input.url,
  });

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .insert({
      user_id: user.id,
      company_id: companyId,
      title,
      location: input.location,
      description: input.description,
      url: input.url,
      role_family: input.roleFamily,
      is_swe: input.isSwe,
      is_finance: input.isFinance,
      eligible_grad_years: input.eligibleGradYears,
      deadline: input.deadline,
      fingerprint,
    })
    .select("id, deadline, is_swe, is_finance, active, eligible_grad_years")
    .single();

  if (opportunityError || !opportunity) {
    if (opportunityError?.code === "23505") {
      return { ok: false, error: "You've already saved this opportunity." };
    }
    return {
      ok: false,
      error: opportunityError?.message ?? "Could not save opportunity.",
    };
  }

  const targetGradYear = await getTargetGradYear(supabase, user.id);

  const breakdown = scoreOpportunity({
    roleFamily: input.roleFamily,
    isSwe: input.isSwe,
    isFinance: input.isFinance,
    active: true,
    eligibleGradYears: input.eligibleGradYears,
    targetGradYear,
    established: input.established,
    deadline: input.deadline,
  });

  await supabase.from("job_scores").insert(buildJobScoreRow(opportunity.id, breakdown));

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      opportunity_id: opportunity.id,
      stage: "saved",
    })
    .select("id")
    .single();

  if (applicationError || !application) {
    return {
      ok: false,
      error: applicationError?.message ?? "Could not create application.",
    };
  }

  await supabase.from("application_events").insert({
    application_id: application.id,
    from_stage: null,
    to_stage: "saved",
  });

  revalidatePath("/recruiting");
  return { ok: true };
}

export async function updateApplicationStage(
  applicationId: string,
  newStage: ApplicationStage,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("applications")
    .select("stage")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: fetchError?.message ?? "Application not found." };
  }
  if (existing.stage === newStage) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      stage: newStage,
      submitted_date:
        newStage === "applied" ? new Date().toISOString().slice(0, 10) : undefined,
    })
    .eq("id", applicationId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await supabase.from("application_events").insert({
    application_id: applicationId,
    from_stage: existing.stage,
    to_stage: newStage,
  });

  revalidatePath("/recruiting");
  return { ok: true };
}

export type ScoreOverrideInput = {
  skillsExperience: number;
  interestIndustry: number;
  userFeedback: number;
};

/**
 * PLAN.md §9: "Show the score breakdown and let Ishani correct it." Only the
 * three dimensions with no reliable deterministic signal are editable — the
 * rest stay computed from the opportunity's own fields.
 */
export async function updateJobScore(
  opportunityId: string,
  input: ScoreOverrideInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .select("id")
    .eq("id", opportunityId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (opportunityError || !opportunity) {
    return { ok: false, error: "Opportunity not found." };
  }

  const { data: score, error: scoreError } = await supabase
    .from("job_scores")
    .select(
      "role_family_score, eligibility_score, established_company_score, deadline_urgency_score, excluded",
    )
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  if (scoreError || !score) {
    return { ok: false, error: "Score not found." };
  }

  const skillsExperience = clampScore(input.skillsExperience, 0, 20);
  const interestIndustry = clampScore(input.interestIndustry, 0, 10);
  const userFeedback = clampScore(input.userFeedback, 0, 5);

  const total = score.excluded
    ? 0
    : score.role_family_score +
      skillsExperience +
      score.eligibility_score +
      interestIndustry +
      score.established_company_score +
      score.deadline_urgency_score +
      userFeedback;

  const { error: updateError } = await supabase
    .from("job_scores")
    .update({
      skills_experience_score: skillsExperience,
      interest_industry_score: interestIndustry,
      user_feedback_score: userFeedback,
      total_score: total,
    })
    .eq("opportunity_id", opportunityId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}

function clampScore(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export type ApplicationDetailsInput = {
  notes: string | null;
  prepNotes: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
};

/** Covers task 4.6 (next action/follow-up) and 4.9 (prep notes) — both live on the same application detail sheet. */
export async function updateApplicationDetails(
  applicationId: string,
  input: ApplicationDetailsInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({
      notes: input.notes?.trim() || null,
      prep_notes: input.prepNotes?.trim() || null,
      next_action: input.nextAction?.trim() || null,
      next_action_date: input.nextActionDate,
    })
    .eq("id", applicationId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}
