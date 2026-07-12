import type { createClient } from "@/lib/supabase/server";
import { deleteEvent, insertEvent } from "./calendar";
import { GOOGLE_SCOPES } from "./oauth";
import { getGoogleIntegration } from "./integration";
import { getValidGoogleAccessToken } from "./tokens";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Writes an approved time-block suggestion to the dedicated GYST calendar,
 * if (and only if) the user has granted the write scope and that calendar
 * exists (PLAN.md §3, §8: write only after approval, only to a calendar this
 * app created). No-ops silently otherwise — accepting a suggestion must
 * never fail just because Google write-back isn't set up.
 */
export async function writeApprovedBlockToGoogle(
  supabase: SupabaseServerClient,
  userId: string,
  block: { title: string; startAt: string; endAt: string; timeZone: string },
): Promise<string | null> {
  const integration = await getGoogleIntegration(supabase, userId);
  const gystCalendarId = integration?.settings.gyst_calendar_id;
  const hasWriteScope = integration?.granted_scopes.includes(
    GOOGLE_SCOPES.calendarAppCreated,
  );
  if (!integration || !gystCalendarId || !hasWriteScope) return null;

  const accessToken = await getValidGoogleAccessToken(supabase, userId);
  if (!accessToken) return null;

  const event = await insertEvent(accessToken, gystCalendarId, {
    title: block.title,
    startAt: block.startAt,
    endAt: block.endAt,
    timeZone: block.timeZone,
  });
  return event.id;
}

/** Deletes a previously written GYST-calendar event. Throws if the delete itself fails, so the caller can surface it and keep the local record intact. */
export async function deleteGoogleBlockEvent(
  supabase: SupabaseServerClient,
  userId: string,
  googleEventId: string,
): Promise<void> {
  const integration = await getGoogleIntegration(supabase, userId);
  const gystCalendarId = integration?.settings.gyst_calendar_id;
  if (!gystCalendarId) return;

  const accessToken = await getValidGoogleAccessToken(supabase, userId);
  if (!accessToken) return;

  await deleteEvent(accessToken, gystCalendarId, googleEventId);
}
