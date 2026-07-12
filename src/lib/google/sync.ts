import type { createClient } from "@/lib/supabase/server";
import { listCalendars, listEvents, SyncTokenExpiredError } from "./calendar";
import {
  getGoogleIntegration,
  markGoogleError,
  updateGoogleSettings,
} from "./integration";
import { normalizeGoogleEvent } from "./normalize";
import { getValidGoogleAccessToken } from "./tokens";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type SyncCalendarSummary = {
  calendarId: string;
  created: number;
  updated: number;
  deleted: number;
  nextSyncToken: string | null;
};

/**
 * Syncs one Google calendar into `events`, incrementally when a prior
 * syncToken exists. On a 410 (expired token — PLAN.md §7's incremental sync
 * requirement), falls back to a full resync from now and returns a fresh
 * token to store. Existing rows are matched by (user_id, source, source_id)
 * so re-running never creates duplicates.
 */
export async function syncGoogleCalendarEvents(
  supabase: SupabaseServerClient,
  userId: string,
  accessToken: string,
  calendarId: string,
  isFixedCommitment: boolean,
  priorSyncToken: string | null,
): Promise<SyncCalendarSummary> {
  let events;
  let nextSyncToken: string | null;
  try {
    const result = await listEvents(
      accessToken,
      calendarId,
      priorSyncToken
        ? { syncToken: priorSyncToken }
        : { timeMin: new Date().toISOString() },
    );
    events = result.events;
    nextSyncToken = result.nextSyncToken;
  } catch (error) {
    if (!(error instanceof SyncTokenExpiredError)) throw error;
    const result = await listEvents(accessToken, calendarId, {
      timeMin: new Date().toISOString(),
    });
    events = result.events;
    nextSyncToken = result.nextSyncToken;
  }

  let created = 0;
  let updated = 0;
  let deleted = 0;

  for (const raw of events) {
    if (raw.status === "cancelled") {
      const { count } = await supabase
        .from("events")
        .delete({ count: "exact" })
        .eq("user_id", userId)
        .eq("source", "google")
        .eq("source_id", raw.id);
      deleted += count ?? 0;
      continue;
    }

    const normalized = normalizeGoogleEvent(raw);
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("user_id", userId)
      .eq("source", "google")
      .eq("source_id", normalized.sourceId)
      .maybeSingle();

    const { error } = await supabase.from("events").upsert(
      {
        user_id: userId,
        title: normalized.title,
        kind: isFixedCommitment ? "fixed" : "flexible",
        start_at: normalized.startAt,
        end_at: normalized.endAt,
        all_day: normalized.allDay,
        time_zone: normalized.timeZone,
        location: normalized.location,
        calendar_id: calendarId,
        is_fixed_commitment: isFixedCommitment,
        source: "google",
        source_id: normalized.sourceId,
        recurring_source_id: normalized.recurringSourceId,
      },
      { onConflict: "user_id,source,source_id" },
    );
    if (error) {
      throw new Error(
        `Failed to upsert event ${normalized.sourceId}: ${error.message}`,
      );
    }
    if (existing) updated++;
    else created++;
  }

  return { calendarId, created, updated, deleted, nextSyncToken };
}

export type RunGoogleSyncResult =
  | {
      ok: true;
      calendarsSynced: number;
      created: number;
      updated: number;
      deleted: number;
    }
  | { ok: false; error: string };

/**
 * Syncs every calendar in the connected Google account (excluding the
 * dedicated GYST write calendar, so approved blocks don't get re-imported
 * as ordinary flexible events) into `events`, and logs one `sync_runs` row
 * for the whole pass. Per-calendar sync cursors live in
 * `integrations.settings.sync_tokens` since Google issues one per calendar.
 */
export async function runGoogleSync(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<RunGoogleSyncResult> {
  const accessToken = await getValidGoogleAccessToken(supabase, userId);
  if (!accessToken) {
    return { ok: false, error: "Google Calendar isn't connected." };
  }

  const integration = await getGoogleIntegration(supabase, userId);
  const fixedCalendarIds = new Set(
    integration?.settings.fixed_calendar_ids ?? [],
  );
  const gystCalendarId = integration?.settings.gyst_calendar_id;
  const priorSyncTokens = integration?.settings.sync_tokens ?? {};

  const { data: syncRun } = await supabase
    .from("sync_runs")
    .insert({ user_id: userId, provider: "google", status: "running" })
    .select("id")
    .single();

  try {
    const calendars = (await listCalendars(accessToken)).filter(
      (cal) => cal.id !== gystCalendarId,
    );

    let created = 0;
    let updated = 0;
    let deleted = 0;
    const nextSyncTokens: Record<string, string> = { ...priorSyncTokens };

    for (const calendar of calendars) {
      const summary = await syncGoogleCalendarEvents(
        supabase,
        userId,
        accessToken,
        calendar.id,
        fixedCalendarIds.has(calendar.id),
        priorSyncTokens[calendar.id] ?? null,
      );
      created += summary.created;
      updated += summary.updated;
      deleted += summary.deleted;
      if (summary.nextSyncToken)
        nextSyncTokens[calendar.id] = summary.nextSyncToken;
    }

    await updateGoogleSettings(supabase, userId, {
      sync_tokens: nextSyncTokens,
    });
    await supabase
      .from("integrations")
      .update({
        last_synced_at: new Date().toISOString(),
        status: "connected",
        error: null,
      })
      .eq("user_id", userId)
      .eq("provider", "google");

    if (syncRun) {
      await supabase
        .from("sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          events_created: created,
          events_updated: updated,
          events_deleted: deleted,
        })
        .eq("id", syncRun.id);
    }

    return {
      ok: true,
      calendarsSynced: calendars.length,
      created,
      updated,
      deleted,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error.";
    await markGoogleError(supabase, userId, message);
    if (syncRun) {
      await supabase
        .from("sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "error",
          error: message,
        })
        .eq("id", syncRun.id);
    }
    return { ok: false, error: message };
  }
}
