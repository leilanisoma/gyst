export type DateRange = { start: Date; end: Date };

function localPartsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * UTC instant for local midnight, `dayOffset` days from `reference`, in `timeZone`.
 * Derives the zone's current offset from `reference` itself rather than a date
 * library, so it stays correct across the DST transition on `reference`'s own day.
 */
function zonedMidnightUtc(
  reference: Date,
  timeZone: string,
  dayOffset: number,
): Date {
  const { year, month, day, hour, minute, second } = localPartsInZone(
    reference,
    timeZone,
  );
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMs = wallClockAsUtc - reference.getTime();
  return new Date(
    Date.UTC(year, month - 1, day + dayOffset, 0, 0, 0) - offsetMs,
  );
}

/** The local calendar day containing `reference`, as a [start, end) UTC range. */
export function getLocalDayRange(reference: Date, timeZone: string): DateRange {
  return {
    start: zonedMidnightUtc(reference, timeZone, 0),
    end: zonedMidnightUtc(reference, timeZone, 1),
  };
}

/** `days` consecutive local calendar days starting with `reference`'s day. */
export function getLocalDayRanges(
  reference: Date,
  timeZone: string,
  days: number,
): DateRange[] {
  return Array.from({ length: days }, (_, i) => ({
    start: zonedMidnightUtc(reference, timeZone, i),
    end: zonedMidnightUtc(reference, timeZone, i + 1),
  }));
}

/** `reference`'s local calendar date in `timeZone`, as `YYYY-MM-DD`. */
export function getLocalDateString(reference: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}
