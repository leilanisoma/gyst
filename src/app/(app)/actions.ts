"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Energy, Mood, SleepPerception, Stress } from "@/lib/check-ins";
import {
  getLocalDateString,
  getLocalDayOfWeek,
  getLocalTimeUtc,
} from "@/lib/date-range";
import {
  buildFreeIntervals,
  clipToCapacity,
  placeTasks,
  type PlacementCandidate,
} from "@/lib/scheduling";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CheckInInput = {
  check_in_date: string;
  energy: Energy;
  mood: Mood | null;
  stress: Stress | null;
  sleep_perception: SleepPerception | null;
  capacity_minutes: number | null;
  note: string | null;
};

export async function upsertCheckIn(
  input: CheckInInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("check_ins").upsert(
    {
      user_id: user.id,
      check_in_date: input.check_in_date,
      energy: input.energy,
      mood: input.mood,
      stress: input.stress,
      sleep_perception: input.sleep_perception,
      capacity_minutes: input.capacity_minutes,
      note: input.note?.trim() || null,
    },
    { onConflict: "user_id,check_in_date" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}

export type GenerateSuggestionsResult =
  | { ok: true; placed: number; candidates: number }
  | { ok: false; error: string };

export async function generateTimeBlockSuggestions(): Promise<GenerateSuggestionsResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timeZone = profile?.timezone ?? "UTC";

  const { data: preferences } = await supabase
    .from("preferences")
    .select("working_hours_start, working_hours_end, buffer_minutes")
    .eq("id", user.id)
    .maybeSingle();

  const now = new Date();
  const todayString = getLocalDateString(now, timeZone);
  const dayOfWeek = getLocalDayOfWeek(now, timeZone);
  const dayRange = {
    start: getLocalTimeUtc(
      now,
      timeZone,
      preferences?.working_hours_start ?? "09:00",
    ),
    end: getLocalTimeUtc(
      now,
      timeZone,
      preferences?.working_hours_end ?? "18:00",
    ),
  };

  const { data: schedules } = await supabase
    .from("recurring_schedules")
    .select("start_time, end_time")
    .eq("day_of_week", dayOfWeek)
    .eq("active", true);

  const fixedCommitments = (schedules ?? []).map((schedule) => ({
    start: getLocalTimeUtc(now, timeZone, schedule.start_time),
    end: getLocalTimeUtc(now, timeZone, schedule.end_time),
  }));

  const { data: checkIn } = await supabase
    .from("check_ins")
    .select("energy, capacity_minutes")
    .eq("check_in_date", todayString)
    .maybeSingle();

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "id, due_date, priority, goal_id, estimated_minutes, energy, rollover_count, earliest_start",
    )
    .neq("status", "completed");

  const { data: existingSuggestions } = await supabase
    .from("time_block_suggestions")
    .select("id, task_id, status")
    .eq("suggestion_date", todayString);

  const acceptedTaskIds = new Set(
    (existingSuggestions ?? [])
      .filter((s) => s.status === "accepted")
      .map((s) => s.task_id),
  );
  const staleProposedIds = (existingSuggestions ?? [])
    .filter((s) => s.status === "proposed")
    .map((s) => s.id);

  if (staleProposedIds.length > 0) {
    await supabase
      .from("time_block_suggestions")
      .delete()
      .in("id", staleProposedIds);
  }

  const candidates: PlacementCandidate[] = (tasks ?? [])
    .filter((t) => !acceptedTaskIds.has(t.id))
    .filter((t) => !t.due_date || new Date(t.due_date) < dayRange.end)
    .filter((t) => !t.earliest_start || new Date(t.earliest_start) <= now)
    .map((t) => ({
      id: t.id,
      due_date: t.due_date,
      priority: t.priority as PlacementCandidate["priority"],
      goal_id: t.goal_id,
      estimated_minutes: t.estimated_minutes,
      energy: t.energy as PlacementCandidate["energy"],
      rollover_count: t.rollover_count,
    }));

  const freeIntervals = clipToCapacity(
    buildFreeIntervals(
      dayRange,
      fixedCommitments,
      preferences?.buffer_minutes ?? 15,
    ),
    checkIn?.capacity_minutes ?? null,
  );

  const placed = placeTasks(candidates, freeIntervals, {
    now,
    userEnergy: (checkIn?.energy as PlacementCandidate["energy"]) ?? null,
  });

  if (placed.length > 0) {
    const { error } = await supabase.from("time_block_suggestions").insert(
      placed.map((block) => ({
        user_id: user.id,
        task_id: block.taskId,
        suggestion_date: todayString,
        start_at: block.start.toISOString(),
        end_at: block.end.toISOString(),
        score: block.score,
        status: "proposed",
        explanation: block.explanation,
      })),
    );
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath("/");
  return { ok: true, placed: placed.length, candidates: candidates.length };
}

export async function updateTimeBlockSuggestionStatus(
  id: string,
  status: "accepted" | "dismissed",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_block_suggestions")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateTimeBlockSuggestionTime(
  id: string,
  startAt: string,
  endAt: string,
): Promise<ActionResult> {
  if (new Date(startAt) >= new Date(endAt)) {
    return { ok: false, error: "End time must be after start time." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("time_block_suggestions")
    .update({ start_at: startAt, end_at: endAt })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}
