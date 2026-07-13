"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/assessments";

/** Actual-time feedback half of PLAN.md §15 task 6.8 — the predicted half lands at sync time (src/lib/canvas/estimate.ts). */
export async function logActualMinutes(taskId: string, actualMinutes: number): Promise<ActionResult> {
  if (!Number.isFinite(actualMinutes) || actualMinutes <= 0) {
    return { ok: false, error: "Enter a positive number of minutes." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_estimates")
    .update({ actual_minutes: Math.round(actualMinutes) })
    .eq("task_id", taskId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/school");
  return { ok: true };
}
