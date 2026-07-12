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
