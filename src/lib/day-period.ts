/**
 * Time-of-day bucketing for the Phase 9D "living room" palette — distinct
 * from `getLocalTimeOfDay` in `date-range.ts`, which returns a wall-clock
 * `"HH:MM"` string for schedule/companion logic. This is purely cosmetic
 * (which of four pastel themes to show) so it intentionally uses the
 * runtime's local clock rather than the user's stored profile timezone.
 */

export type DayPeriod = "dawn" | "day" | "dusk" | "night";

/** Hour (0-23, local clock) at which each period begins. */
const PERIOD_START_HOUR: Record<DayPeriod, number> = {
  dawn: 5,
  day: 8,
  dusk: 17,
  night: 20,
};

const PERIODS_BY_START_HOUR_DESC: DayPeriod[] = ["night", "dusk", "day", "dawn"];

/** Buckets a 0-23 local hour into a day period. Night wraps past midnight. */
export function dayPeriodFromHour(hour: number): DayPeriod {
  const found = PERIODS_BY_START_HOUR_DESC.find(
    (period) => hour >= PERIOD_START_HOUR[period],
  );
  return found ?? "night";
}

/** Convenience wrapper over `dayPeriodFromHour` for a `Date` (local clock). */
export function getDayPeriod(reference: Date = new Date()): DayPeriod {
  return dayPeriodFromHour(reference.getHours());
}
