export type XpEventType =
  | "capture"
  | "check_in"
  | "set_outcomes"
  | "accept_block"
  | "finish_block"
  | "review_overdue"
  | "return_from_absence";

/** Cozy progress, not addictive mechanics (PLAN.md §13) — small, flat awards per action. */
export const XP_POINTS: Record<XpEventType, number> = {
  capture: 2,
  check_in: 5,
  set_outcomes: 3,
  accept_block: 5,
  finish_block: 5,
  review_overdue: 3,
  return_from_absence: 15,
};

/** Days away before a return counts as "coming back after time away" rather than routine use. */
export const ABSENCE_DAYS_THRESHOLD = 7;

/**
 * Total-XP thresholds for the ambient growth visual (Phase 9D §13) that
 * replaces the numeric XP readout — a room element that grows/brightens
 * instead of a count. Index into the array = growth stage.
 */
export const GROWTH_STAGE_XP_THRESHOLDS = [0, 50, 150, 300, 600] as const;

export type XpEvent = { points: number; occurred_on: string };

export function totalXp(events: XpEvent[]): number {
  return events.reduce((sum, event) => sum + event.points, 0);
}

function shiftDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

function daysBetweenDateStrings(
  fromDateStr: string,
  toDateStr: string,
): number {
  const [fy, fm, fd] = fromDateStr.split("-").map(Number);
  const [ty, tm, td] = toDateStr.split("-").map(Number);
  const fromMs = Date.UTC(fy, fm - 1, fd);
  const toMs = Date.UTC(ty, tm - 1, td);
  return Math.round((toMs - fromMs) / 86_400_000);
}

/** Distinct engaged calendar dates within the 7-day window ending on `today` (inclusive). */
export function daysEngagedThisWeek(
  events: { occurred_on: string }[],
  today: string,
): number {
  const start = shiftDateString(today, -6);
  const dates = new Set(
    events
      .map((event) => event.occurred_on)
      .filter((date) => date >= start && date <= today),
  );
  return dates.size;
}

/** Growth stage (0 = seed .. highest = fullest bloom) for a given total XP. */
export function growthStage(xp: number): number {
  let stage = 0;
  for (let i = 0; i < GROWTH_STAGE_XP_THRESHOLDS.length; i++) {
    if (xp >= GROWTH_STAGE_XP_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

/**
 * True when the most recent prior engagement was at least
 * `ABSENCE_DAYS_THRESHOLD` days before `today`. A brand-new user (no prior
 * dates) isn't "returning," so this is false.
 */
export function shouldAwardReturnBonus(
  priorOccurredOnDates: string[],
  today: string,
): boolean {
  if (priorOccurredOnDates.length === 0) return false;
  const mostRecent = priorOccurredOnDates.reduce((a, b) => (a > b ? a : b));
  return daysBetweenDateStrings(mostRecent, today) >= ABSENCE_DAYS_THRESHOLD;
}
