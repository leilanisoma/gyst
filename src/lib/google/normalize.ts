import type { GoogleEventResource } from "./calendar";

export type NormalizedEvent = {
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  timeZone: string | null;
  location: string | null;
  sourceId: string;
  recurringSourceId: string | null;
};

/**
 * Converts one non-cancelled Google event instance (from a `singleEvents:
 * true` listing, so recurrence is already expanded into concrete
 * occurrences) into GYST's `events` row shape. Callers must check
 * `raw.status === "cancelled"` themselves and delete by `sourceId` instead
 * of normalizing — cancelled instances may be missing start/end.
 */
export function normalizeGoogleEvent(
  raw: GoogleEventResource,
): NormalizedEvent {
  const allDay = Boolean(raw.start.date) && !raw.start.dateTime;

  return {
    title: raw.summary?.trim() || "(untitled)",
    startAt: allDay
      ? `${raw.start.date}T00:00:00.000Z`
      : new Date(raw.start.dateTime!).toISOString(),
    endAt: allDay
      ? `${raw.end.date}T00:00:00.000Z`
      : new Date(raw.end.dateTime!).toISOString(),
    allDay,
    timeZone: raw.start.timeZone ?? null,
    location: raw.location ?? null,
    sourceId: raw.id,
    recurringSourceId: raw.recurringEventId ?? null,
  };
}
