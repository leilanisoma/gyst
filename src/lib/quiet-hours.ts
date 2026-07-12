import { getLocalTimeOfDay } from "./date-range";

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/**
 * Whether `now` falls inside the [quietHoursStart, quietHoursEnd) local
 * wall-clock window in `timeZone`. Compares minutes-of-day directly rather
 * than Date instants, so overnight windows (e.g. 22:00-07:00, which wrap
 * past midnight) and DST transitions don't need special-casing.
 */
export function isWithinQuietHours(
  now: Date,
  timeZone: string,
  quietHoursStart: string,
  quietHoursEnd: string,
): boolean {
  const start = toMinutes(quietHoursStart);
  const end = toMinutes(quietHoursEnd);
  if (start === end) return false;

  const current = toMinutes(getLocalTimeOfDay(now, timeZone));

  if (start < end) {
    return current >= start && current < end;
  }
  // Overnight window: quiet from `start` through midnight, then until `end`.
  return current >= start || current < end;
}
