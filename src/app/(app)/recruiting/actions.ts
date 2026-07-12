"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { opportunityFingerprint, type RoleFamily } from "@/lib/recruiting";
import { scoreOpportunity } from "@/lib/job-scoring";

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

  const { data: existingCompany } = await supabase
    .from("companies")
    .select("id, established")
    .eq("user_id", user.id)
    .ilike("name", companyName)
    .maybeSingle();

  let companyId = existingCompany?.id ?? null;
  if (!companyId) {
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert({
        user_id: user.id,
        name: companyName,
        established: input.established,
      })
      .select("id")
      .single();
    if (companyError || !newCompany) {
      return {
        ok: false,
        error: companyError?.message ?? "Could not create company.",
      };
    }
    companyId = newCompany.id;
  } else if (existingCompany && existingCompany.established !== input.established) {
    await supabase
      .from("companies")
      .update({ established: input.established })
      .eq("id", companyId);
  }

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

  const { data: preferences } = await supabase
    .from("preferences")
    .select("recruiting_preferences")
    .eq("id", user.id)
    .maybeSingle();
  const targetGradYear =
    (preferences?.recruiting_preferences as { target_grad_year?: number } | null)
      ?.target_grad_year ?? 2027;

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

  await supabase.from("job_scores").insert({
    opportunity_id: opportunity.id,
    role_family_score: breakdown.roleFamily,
    skills_experience_score: breakdown.skillsExperience,
    eligibility_score: breakdown.eligibility,
    interest_industry_score: breakdown.interestIndustry,
    established_company_score: breakdown.establishedCompany,
    deadline_urgency_score: breakdown.deadlineUrgency,
    user_feedback_score: breakdown.userFeedback,
    total_score: breakdown.total,
    excluded: breakdown.excluded,
    exclusion_reason: breakdown.exclusionReason ?? null,
    explanation: breakdown.explanation,
  });

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
