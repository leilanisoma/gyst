"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  AteConsistently,
  Energy,
  Mood,
  Recovery,
  SleepPerception,
  Stress,
  WellnessCheckIn,
} from "@/lib/wellness";
import {
  cycleObservationEntrySchema,
  deleteAllCycleObservations,
  deleteCycleObservation,
  listCycleObservations,
  parseCycleCsv,
  upsertCycleObservationEntry,
  upsertCycleObservations,
  type CycleObservation,
  type CycleObservationEntry,
} from "@/lib/health/cycle-observations";
import {
  dailySummaryMetricSchema,
  deleteAllHealthSummaries,
  deleteDailySummary,
  listDailySummaries,
  upsertDailySummaries,
  type DailySummary,
  type DailySummaryMetric,
} from "@/lib/health/daily-summaries";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type WellnessCheckInInput = {
  check_in_date: string;
  energy: Energy | null;
  mood: Mood | null;
  stress: Stress | null;
  sleep_perception: SleepPerception | null;
  ate_consistently: AteConsistently | null;
  recovery: Recovery | null;
  note: string | null;
};

/** Every field is optional/skippable per PLAN.md §11 — nothing here is required to save. */
export async function upsertWellnessCheckIn(
  input: WellnessCheckInInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("wellness_check_ins").upsert(
    {
      user_id: user.id,
      check_in_date: input.check_in_date,
      energy: input.energy,
      mood: input.mood,
      stress: input.stress,
      sleep_perception: input.sleep_perception,
      ate_consistently: input.ate_consistently,
      recovery: input.recovery,
      note: input.note?.trim() || null,
    },
    { onConflict: "user_id,check_in_date" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/wellness");
  return { ok: true };
}

export async function deleteWellnessCheckIn(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("wellness_check_ins")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/wellness");
  return { ok: true };
}

/** Easy-to-find delete control (docs/DATA_CLASSIFICATION.md "export and deletion must cover every tier"). */
export async function deleteAllWellnessData(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("wellness_check_ins")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/wellness");
  return { ok: true };
}

export type ExportWellnessDataResult =
  | { ok: true; exported_at: string; check_ins: WellnessCheckIn[] }
  | { ok: false; error: string };

export async function exportWellnessData(): Promise<ExportWellnessDataResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data, error } = await supabase
    .from("wellness_check_ins")
    .select(
      "id, check_in_date, energy, mood, stress, sleep_perception, ate_consistently, recovery, note",
    )
    .eq("user_id", user.id)
    .order("check_in_date", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    exported_at: new Date().toISOString(),
    check_ins: (data ?? []) as WellnessCheckIn[],
  };
}

export type ImportCycleCsvResult =
  | { ok: true; imported: number; errors: string[] }
  | { ok: false; error: string };

/**
 * Manual/CSV import (PLAN.md §8) — the resolution of the 9B "evaluate Mira
 * export/import" checklist item without assuming any third-party API or
 * scraping a health account.
 */
export async function importCycleObservationsCsv(
  csvText: string,
): Promise<ImportCycleCsvResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { rows, errors } = parseCycleCsv(csvText);
  if (rows.length === 0) {
    return { ok: false, error: errors[0] ?? "No valid rows found in that CSV." };
  }

  const result = await upsertCycleObservations(supabase, user.id, rows, "manual_csv");
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/wellness");
  return { ok: true, imported: result.count ?? rows.length, errors };
}

export async function getCycleObservationsList(): Promise<CycleObservation[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return [];
  }
  return listCycleObservations(supabase, user.id);
}

/**
 * Manual single-day entry for fertility-monitor hormone readings (LH, E3G,
 * PdG, FSH) plus a period on/off flag — separate from the CSV import path,
 * which is for flow/symptoms/note bulk backfill.
 */
export async function saveCycleObservationEntry(
  input: CycleObservationEntry,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const parsed = cycleObservationEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid entry." };
  }

  const result = await upsertCycleObservationEntry(supabase, user.id, parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/wellness");
  return { ok: true };
}

export async function deleteCycleObservationEntry(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const result = await deleteCycleObservation(supabase, user.id, id);
  revalidatePath("/wellness");
  return result;
}

/** Separate deletion control from wellness_check_ins/health summaries per PLAN.md §11. */
export async function deleteAllCycleObservationsData(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const result = await deleteAllCycleObservations(supabase, user.id);
  revalidatePath("/wellness");
  return result;
}

/**
 * Manual entry replaces the native HealthKit sync 9B originally planned
 * (no Apple Developer Program enrollment — see docs/PHASES/phase-9.md).
 * Same allowlist/validation the sync endpoint used to enforce, just fed by
 * a webapp form instead of a device.
 */
export async function upsertHealthDailySummary(
  input: DailySummaryMetric,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const parsed = dailySummaryMetricSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid entry." };
  }

  const result = await upsertDailySummaries(supabase, user.id, [parsed.data]);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/wellness");
  return { ok: true };
}

export async function getHealthDailySummariesList(): Promise<DailySummary[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return [];
  }
  return listDailySummaries(supabase, user.id);
}

export async function deleteHealthDailySummaryEntry(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const result = await deleteDailySummary(supabase, user.id, id);
  revalidatePath("/wellness");
  return result;
}

/** Separate deletion control from cycle_observations/wellness_check_ins per PLAN.md §11. */
export async function deleteAllHealthDailySummariesData(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const result = await deleteAllHealthSummaries(supabase, user.id);
  revalidatePath("/wellness");
  return result;
}
