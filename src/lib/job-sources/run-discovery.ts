import type { createClient } from "@/lib/supabase/server";
import type { SupabaseServiceClient } from "@/lib/supabase/service";
import { getAIClient } from "@/ai";
import { ingestNormalizedJob, type ResumeFitContext } from "./ingest";
import { getActiveResumeText } from "./resume-fit";
import { getAdapter } from "./registry";
import type { AdapterId, SourceConfig } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AnySupabaseClient = SupabaseServerClient | SupabaseServiceClient;

export type SourceConfigRow = {
  id: string;
  adapter_id: AdapterId;
  label: string;
  config: SourceConfig;
};

export type SourceRunSummary = {
  sourceConfigId: string;
  label: string;
  status: "success" | "error";
  itemsFound: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsExpired: number;
  error?: string;
};

/**
 * Runs one source's full discovery pass: fetch, normalize, upsert, then
 * expire any previously-active opportunity from this source that this run
 * no longer sees (closed/pulled posting). Every run is recorded in
 * `source_runs` — success or failure — so a broken source fails visibly
 * (PLAN.md §15 Phase 5 exit criteria) instead of just quietly returning
 * nothing next time.
 */
export async function runDiscoveryForSource(
  supabase: AnySupabaseClient,
  userId: string,
  sourceConfig: SourceConfigRow,
  resumeFit?: ResumeFitContext,
): Promise<SourceRunSummary> {
  const adapter = getAdapter(sourceConfig.adapter_id);
  const { data: run } = await supabase
    .from("source_runs")
    .insert({ source_config_id: sourceConfig.id })
    .select("id")
    .single();

  try {
    const rawJobs = await adapter.discover(sourceConfig.config);
    let created = 0;
    let updated = 0;
    const seenExternalIds: string[] = [];

    for (const raw of rawJobs) {
      const normalized = adapter.normalize(raw, sourceConfig.config);
      seenExternalIds.push(normalized.externalId);
      const result = await ingestNormalizedJob(
        supabase,
        userId,
        sourceConfig.adapter_id,
        normalized,
        resumeFit,
      );
      if (result === "created") created++;
      else if (result === "updated") updated++;
    }

    const expired = await expireUnseenOpportunities(
      supabase,
      userId,
      sourceConfig.adapter_id,
      seenExternalIds,
    );

    if (run) {
      await supabase
        .from("source_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          items_found: rawJobs.length,
          items_created: created,
          items_updated: updated,
          items_expired: expired,
        })
        .eq("id", run.id);
    }

    return {
      sourceConfigId: sourceConfig.id,
      label: sourceConfig.label,
      status: "success",
      itemsFound: rawJobs.length,
      itemsCreated: created,
      itemsUpdated: updated,
      itemsExpired: expired,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (run) {
      await supabase
        .from("source_runs")
        .update({ finished_at: new Date().toISOString(), status: "error", error: message })
        .eq("id", run.id);
    }
    return {
      sourceConfigId: sourceConfig.id,
      label: sourceConfig.label,
      status: "error",
      itemsFound: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsExpired: 0,
      error: message,
    };
  }
}

async function expireUnseenOpportunities(
  supabase: AnySupabaseClient,
  userId: string,
  sourceId: AdapterId,
  seenExternalIds: string[],
): Promise<number> {
  const { data: existing } = await supabase
    .from("opportunities")
    .select("id, external_id")
    .eq("user_id", userId)
    .eq("source", sourceId)
    .eq("active", true);

  const seen = new Set(seenExternalIds);
  const staleIds = (existing ?? [])
    .filter((opportunity) => opportunity.external_id && !seen.has(opportunity.external_id))
    .map((opportunity) => opportunity.id);

  if (staleIds.length === 0) return 0;
  await supabase.from("opportunities").update({ active: false }).in("id", staleIds);
  return staleIds.length;
}

/**
 * Runs every enabled source for the user, sequentially — a daily job over a
 * handful of sources has no need for concurrency. The resume is fetched
 * and extracted once per run (not once per posting) and passed to every
 * source — `getActiveResumeText` returns null when no resume is uploaded
 * yet, in which case the education-fit classification is skipped rather
 * than blocking discovery.
 */
export async function runAllDiscovery(
  supabase: AnySupabaseClient,
  userId: string,
): Promise<SourceRunSummary[]> {
  const { data: sourceConfigs } = await supabase
    .from("source_configs")
    .select("id, adapter_id, label, config")
    .eq("user_id", userId)
    .eq("enabled", true);

  const aiClient = getAIClient();
  const resumeText = aiClient ? await getActiveResumeText(supabase, userId) : null;
  const resumeFit: ResumeFitContext | undefined =
    aiClient && resumeText ? { aiClient, resumeText } : undefined;

  const summaries: SourceRunSummary[] = [];
  for (const sourceConfig of sourceConfigs ?? []) {
    summaries.push(
      await runDiscoveryForSource(supabase, userId, sourceConfig as SourceConfigRow, resumeFit),
    );
  }
  return summaries;
}
