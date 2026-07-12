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
 * UTC instant for a local wall-clock time (`"HH:MM"` or `"HH:MM:SS"`),
 * `dayOffset` days from `reference`, in `timeZone`. Derives the zone's
 * current offset from `reference` itself rather than a date library, so it
 * stays correct across the DST transition on `reference`'s own day.
 */
export function getLocalTimeUtc(
  reference: Date,
  timeZone: string,
  timeOfDay: string,
  dayOffset = 0,
): Date {
  const [hour, minute, second = 0] = timeOfDay.split(":").map(Number);
  const {
    year,
    month,
    day,
    hour: refHour,
    minute: refMinute,
    second: refSecond,
  } = localPartsInZone(reference, timeZone);
  const wallClockAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    refHour,
    refMinute,
    refSecond,
  );
  const offsetMs = wallClockAsUtc - reference.getTime();
  return new Date(
    Date.UTC(year, month - 1, day + dayOffset, hour, minute, second) - offsetMs,
  );
}

function zonedMidnightUtc(
  reference: Date,
  timeZone: string,
  dayOffset: number,
): Date {
  return getLocalTimeUtc(reference, timeZone, "00:00:00", dayOffset);
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** `reference`'s local day of week in `timeZone`, as 0 (Sunday) - 6 (Saturday). */
export function getLocalDayOfWeek(reference: Date, timeZone: string): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(reference);
  return WEEKDAY_NAMES.indexOf(label);
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
