"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  disconnectGoogleIntegration,
  updateGoogleSettings,
} from "@/lib/google/integration";
import { disconnectGoogleTokens } from "@/lib/google/tokens";
import { runGoogleSync, type RunGoogleSyncResult } from "@/lib/google/sync";
import {
  disconnectGmailIntegration,
  updateGmailSettings,
} from "@/lib/gmail/integration";
import { disconnectGmailTokens } from "@/lib/gmail/tokens";
import { runGmailSync, type RunGmailSyncResult } from "@/lib/gmail/sync";
import type { ScheduleCategory } from "@/lib/recurring-schedules";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type RecurringScheduleInput = {
  title: string;
  category: ScheduleCategory;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
};

export async function createRecurringSchedule(
  input: RecurringScheduleInput,
): Promise<ActionResult> {
  if (!input.title.trim()) {
    return { ok: false, error: "Title can't be empty." };
  }
  if (input.start_time >= input.end_time) {
    return { ok: false, error: "End time must be after start time." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("recurring_schedules").insert({
    user_id: user.id,
    title: input.title.trim(),
    category: input.category,
    day_of_week: input.day_of_week,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location?.trim() || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function disconnectGoogle(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  await disconnectGoogleTokens(supabase, user.id);
  await disconnectGoogleIntegration(supabase, user.id);

  revalidatePath("/settings");
  return { ok: true };
}

export async function syncGoogleCalendarNow(): Promise<RunGoogleSyncResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const result = await runGoogleSync(supabase, user.id);
  revalidatePath("/settings");
  revalidatePath("/");
  return result;
}

export async function setFixedCalendarIds(
  calendarIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  await updateGoogleSettings(supabase, user.id, {
    fixed_calendar_ids: calendarIds,
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function disconnectGmail(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  await disconnectGmailTokens(supabase, user.id);
  await disconnectGmailIntegration(supabase, user.id);

  revalidatePath("/settings");
  return { ok: true };
}

export async function syncGmailNow(): Promise<RunGmailSyncResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const result = await runGmailSync(supabase, user.id);
  revalidatePath("/settings");
  revalidatePath("/gmail");
  return result;
}

export async function setGmailSearchQuery(query: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  await updateGmailSettings(supabase, user.id, { search_query: query.trim() });

  revalidatePath("/settings");
  return { ok: true };
}

export async function setGmailRetentionDays(days: number): Promise<ActionResult> {
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return { ok: false, error: "Retention must be between 1 and 365 days." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  await updateGmailSettings(supabase, user.id, { retention_days: days });

  revalidatePath("/settings");
  return { ok: true };
}

/** Easy-to-find delete control for a Highly sensitive tier (docs/DATA_CLASSIFICATION.md) — clears every stored Gmail excerpt/draft, not just the connection itself. */
export async function purgeGmailData(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error: itemsError } = await supabase
    .from("gmail_items")
    .delete()
    .eq("user_id", user.id);
  if (itemsError) return { ok: false, error: itemsError.message };

  const { error: draftsError } = await supabase
    .from("gmail_drafts")
    .delete()
    .eq("user_id", user.id);
  if (draftsError) return { ok: false, error: draftsError.message };

  const { error: processedError } = await supabase
    .from("gmail_processed_messages")
    .delete()
    .eq("user_id", user.id);
  if (processedError) return { ok: false, error: processedError.message };

  revalidatePath("/settings");
  revalidatePath("/gmail");
  return { ok: true };
}

export async function deleteRecurringSchedule(
  id: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_schedules")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}
