import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The exact allowlist PLAN.md §8 names ("sleep, workouts, activity") —
 * anything outside this shape is a validation error, not silently accepted.
 * Entered manually in the webapp (Phase 9B was descoped from a native
 * HealthKit sync — see docs/PHASES/phase-9.md).
 */
export const dailySummaryMetricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  sleep_minutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
  steps: z.number().int().min(0).nullable().optional(),
  active_energy_kcal: z.number().min(0).nullable().optional(),
  workout_minutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
});

export const syncDailySummariesPayloadSchema = z.object({
  summaries: z.array(dailySummaryMetricSchema).min(1).max(31),
});

export type DailySummaryMetric = z.infer<typeof dailySummaryMetricSchema>;

export type DailySummary = DailySummaryMetric & { id: string };

export type UpsertDailySummariesResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export async function upsertDailySummaries(
  supabase: SupabaseServerClient,
  userId: string,
  summaries: DailySummaryMetric[],
): Promise<UpsertDailySummariesResult> {
  const syncedAt = new Date().toISOString();
  const rows = summaries.map((summary) => ({
    user_id: userId,
    summary_date: summary.date,
    sleep_minutes: summary.sleep_minutes ?? null,
    steps: summary.steps ?? null,
    active_energy_kcal: summary.active_energy_kcal ?? null,
    workout_minutes: summary.workout_minutes ?? null,
    source: "manual_entry",
    synced_at: syncedAt,
  }));

  const { error } = await supabase
    .from("health_daily_summaries")
    .upsert(rows, { onConflict: "user_id,summary_date" });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, count: rows.length };
}

export async function listDailySummaries(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<DailySummary[]> {
  const { data } = await supabase
    .from("health_daily_summaries")
    .select(
      "id, summary_date, sleep_minutes, steps, active_energy_kcal, workout_minutes",
    )
    .eq("user_id", userId)
    .order("summary_date", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.summary_date,
    sleep_minutes: row.sleep_minutes,
    steps: row.steps,
    active_energy_kcal: row.active_energy_kcal,
    workout_minutes: row.workout_minutes,
  }));
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function deleteDailySummary(
  supabase: SupabaseServerClient,
  userId: string,
  id: string,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("health_daily_summaries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** The "delete synced summaries" half of PLAN.md §9's exit criteria. */
export async function deleteAllHealthSummaries(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("health_daily_summaries")
    .delete()
    .eq("user_id", userId);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
