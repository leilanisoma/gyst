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

/** `timeZone`'s UTC offset (local-minus-UTC, in ms) at the instant `date`. */
function offsetAt(date: Date, timeZone: string): number {
  const { year, month, day, hour, minute, second } = localPartsInZone(
    date,
    timeZone,
  );
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return wallClockAsUtc - date.getTime();
}

/**
 * UTC instant for a local wall-clock time (`"HH:MM"` or `"HH:MM:SS"`),
 * `dayOffset` days from `reference`'s local calendar date, in `timeZone`.
 *
 * `reference` is only used to pin the calendar date and as a first guess at
 * the UTC offset; that guess is re-derived at the resulting instant so a DST
 * transition between `reference` and the target time doesn't leave the
 * target on the wrong side of the boundary (e.g. `reference` at midday on a
 * spring-forward day, target time local midnight earlier that same day).
 */
export function getLocalTimeUtc(
  reference: Date,
  timeZone: string,
  timeOfDay: string,
  dayOffset = 0,
): Date {
  const [hour, minute, second = 0] = timeOfDay.split(":").map(Number);
  const { year, month, day } = localPartsInZone(reference, timeZone);
  const wallClockAsUtc = Date.UTC(
    year,
    month - 1,
    day + dayOffset,
    hour,
    minute,
    second,
  );

  const guessOffset = offsetAt(reference, timeZone);
  const guess = new Date(wallClockAsUtc - guessOffset);
  const refinedOffset = offsetAt(guess, timeZone);

  return refinedOffset === guessOffset
    ? guess
    : new Date(wallClockAsUtc - refinedOffset);
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
