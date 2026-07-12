"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Energy, Mood, SleepPerception, Stress } from "@/lib/check-ins";

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
