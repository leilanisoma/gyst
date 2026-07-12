"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { runAllDiscovery, type SourceRunSummary } from "@/lib/job-sources/run-discovery";
import { getAdapter } from "@/lib/job-sources/registry";
import type { AdapterId, SourceConfig } from "@/lib/job-sources/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateSourceConfigInput = {
  adapterId: AdapterId;
  label: string;
  config: SourceConfig;
};

export async function createSourceConfig(input: CreateSourceConfigInput): Promise<ActionResult> {
  const label = input.label.trim();
  if (!label) {
    return { ok: false, error: "Label is required." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("source_configs").insert({
    user_id: user.id,
    adapter_id: input.adapterId,
    label,
    config: input.config as Json,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}

export async function setSourceConfigEnabled(id: string, enabled: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("source_configs").update({ enabled }).eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/recruiting");
  return { ok: true };
}

export async function deleteSourceConfig(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("source_configs").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/recruiting");
  return { ok: true };
}

export type RunDiscoveryResult =
  | { ok: true; summaries: SourceRunSummary[] }
  | { ok: false; error: string };

/** User-triggered discovery run (the "Run discovery now" button) — uses the caller's own session, not the service-role client the daily cron uses. */
export async function runDiscoveryNow(): Promise<RunDiscoveryResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const summaries = await runAllDiscovery(supabase, user.id);
  revalidatePath("/recruiting");
  return { ok: true, summaries };
}

export type SourceHealthResult =
  | { ok: true; health: { ok: boolean; message: string } }
  | { ok: false; error: string };

export async function checkSourceHealth(id: string): Promise<SourceHealthResult> {
  const supabase = await createClient();
  const { data: sourceConfig, error } = await supabase
    .from("source_configs")
    .select("adapter_id, config")
    .eq("id", id)
    .maybeSingle();
  if (error || !sourceConfig) {
    return { ok: false, error: error?.message ?? "Source not found." };
  }

  const adapter = getAdapter(sourceConfig.adapter_id as AdapterId);
  const health = await adapter.healthCheck(sourceConfig.config as SourceConfig);
  return { ok: true, health };
}
