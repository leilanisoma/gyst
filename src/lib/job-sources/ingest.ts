import type { createClient } from "@/lib/supabase/server";
import type { SupabaseServiceClient } from "@/lib/supabase/service";
import type { AIClient } from "@/ai/client";
import { findOrCreateCompany } from "@/lib/companies";
import { buildJobScoreRow, scoreOpportunity } from "@/lib/job-scoring";
import { opportunityFingerprint } from "@/lib/recruiting";
import { getTargetGradYear } from "@/lib/recruiting-preferences";
import type { AdapterId, NormalizedJob } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AnySupabaseClient = SupabaseServerClient | SupabaseServiceClient;

export type IngestResult = "created" | "updated" | "error";

/**
 * Upserts one normalized posting into the same tables the manual capture
 * action writes to (`opportunities`, `job_scores`, `applications`,
 * `application_events`), keyed by the existing dedup fingerprint so a role
 * that shows up on both a company's Greenhouse board and the curated feed
 * collapses into one opportunity. New discoveries land in the `discovered`
 * application stage — distinct from `saved` — so they queue for triage
 * (task 5.5) instead of looking like something the user already decided to
 * pursue.
 */
export type ResumeFitContext = {
  aiClient: AIClient;
  resumeText: string;
};

export async function ingestNormalizedJob(
  supabase: AnySupabaseClient,
  userId: string,
  sourceId: AdapterId,
  job: NormalizedJob,
  resumeFit?: ResumeFitContext,
): Promise<IngestResult> {
  const fingerprint = opportunityFingerprint({
    companyName: job.companyName,
    title: job.title,
    url: job.url,
  });

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id")
    .eq("user_id", userId)
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("opportunities")
      .update({
        last_seen_at: new Date().toISOString(),
        active: true,
        deadline: job.deadline,
      })
      .eq("id", existing.id);
    return error ? "error" : "updated";
  }

  const company = await findOrCreateCompany(supabase, userId, job.companyName);
  if ("error" in company) return "error";

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .insert({
      user_id: userId,
      company_id: company.id,
      title: job.title,
      location: job.location,
      description: job.description,
      url: job.url,
      role_family: job.roleFamily,
      is_swe: job.isSwe,
      is_finance: job.isFinance,
      eligible_grad_years: [],
      deadline: job.deadline,
      posted_at: job.postedAt,
      source: sourceId,
      external_id: job.externalId,
      last_seen_at: new Date().toISOString(),
      fingerprint,
    })
    .select("id")
    .single();

  if (opportunityError || !opportunity) return "error";

  let requiresUnmetEducation = false;
  let educationMismatchReason: string | null = null;
  // Skip the classification call entirely when the role is already excluded
  // by the cheap deterministic checks — no point spending a Gemini call on
  // something that's getting a 0 either way.
  if (resumeFit && !job.isSwe && !job.isFinance) {
    try {
      const fit = await resumeFit.aiClient.classifyEducationFit(
        resumeFit.resumeText,
        job.title,
        job.description,
      );
      requiresUnmetEducation = fit.requiresUnmetEducation;
      educationMismatchReason = fit.requiresUnmetEducation ? fit.reasoning : null;
    } catch {
      // Best-effort — a classification failure shouldn't block ingestion.
    }
  }

  const targetGradYear = await getTargetGradYear(supabase, userId);
  const breakdown = scoreOpportunity({
    roleFamily: job.roleFamily,
    isSwe: job.isSwe,
    isFinance: job.isFinance,
    active: true,
    eligibleGradYears: [],
    targetGradYear,
    established: false,
    deadline: job.deadline,
    requiresUnmetEducation,
    educationMismatchReason,
  });
  await supabase.from("job_scores").insert(buildJobScoreRow(opportunity.id, breakdown));

  const { data: application } = await supabase
    .from("applications")
    .insert({ user_id: userId, opportunity_id: opportunity.id, stage: "discovered" })
    .select("id")
    .single();

  if (application) {
    await supabase.from("application_events").insert({
      application_id: application.id,
      from_stage: null,
      to_stage: "discovered",
    });
  }

  return "created";
}
