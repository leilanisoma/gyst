import type { DateRange } from "./date-range";
import type { TaskPriority } from "./tasks";

export type FixedInterval = { start: Date; end: Date };

/** Reduces computed free time by this fraction before it's offered for scheduling (PLAN.md §7). */
export const SAFETY_FACTOR = 0.25;
/** Free slivers shorter than this are not worth suggesting. */
export const MIN_BLOCK_MINUTES = 15;

/**
 * Free time within `dayRange`, after removing `fixedCommitments` (each padded
 * by `bufferMinutes` on both sides) and applying the safety factor to what's
 * left. Overlapping/adjacent commitments are merged before subtracting.
 */
export function buildFreeIntervals(
  dayRange: DateRange,
  fixedCommitments: FixedInterval[],
  bufferMinutes: number,
  safetyFactor: number = SAFETY_FACTOR,
): FixedInterval[] {
  const bufferMs = bufferMinutes * 60_000;
  const padded = fixedCommitments
    .map((commitment) => ({
      start: new Date(commitment.start.getTime() - bufferMs),
      end: new Date(commitment.end.getTime() + bufferMs),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: FixedInterval[] = [];
  for (const interval of padded) {
    const last = merged[merged.length - 1];
    if (last && interval.start.getTime() <= last.end.getTime()) {
      if (interval.end.getTime() > last.end.getTime()) last.end = interval.end;
    } else {
      merged.push({ ...interval });
    }
  }

  const free: FixedInterval[] = [];
  let cursor = dayRange.start;
  for (const busy of merged) {
    const start = busy.start < dayRange.start ? dayRange.start : busy.start;
    const end = busy.end > dayRange.end ? dayRange.end : busy.end;
    if (start.getTime() > cursor.getTime()) {
      free.push({ start: cursor, end: start });
    }
    if (end.getTime() > cursor.getTime()) cursor = end;
  }
  if (cursor.getTime() < dayRange.end.getTime()) {
    free.push({ start: cursor, end: dayRange.end });
  }

  return free
    .map((interval) => {
      const durationMs = interval.end.getTime() - interval.start.getTime();
      const usableMs = durationMs * (1 - safetyFactor);
      return {
        start: interval.start,
        end: new Date(interval.start.getTime() + usableMs),
      };
    })
    .filter(
      (interval) =>
        (interval.end.getTime() - interval.start.getTime()) / 60_000 >=
        MIN_BLOCK_MINUTES,
    );
}

export function totalMinutes(intervals: FixedInterval[]): number {
  return intervals.reduce(
    (sum, interval) =>
      sum + (interval.end.getTime() - interval.start.getTime()) / 60_000,
    0,
  );
}

export type EnergyLevel = "low" | "medium" | "high";

export type ScorableTask = {
  due_date: string | null;
  priority: TaskPriority;
  goal_id: string | null;
  estimated_minutes: number | null;
  energy: EnergyLevel | null;
  rollover_count: number;
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 1,
  medium: 3,
  high: 5,
};

const ENERGY_RANK: Record<EnergyLevel, number> = { low: 0, medium: 1, high: 2 };

/** Higher for tasks due sooner; overdue tasks max out rather than growing without bound. */
export function deadlineUrgency(task: ScorableTask, now: Date): number {
  if (!task.due_date) return 0;
  const hoursUntilDue =
    (new Date(task.due_date).getTime() - now.getTime()) / 3_600_000;
  if (hoursUntilDue <= 0) return 10;
  if (hoursUntilDue <= 24) return 8;
  if (hoursUntilDue <= 72) return 5;
  if (hoursUntilDue <= 168) return 2;
  return 0;
}

export function priorityScore(task: ScorableTask): number {
  return PRIORITY_WEIGHT[task.priority];
}

export function goalImportance(task: ScorableTask): number {
  return task.goal_id ? 2 : 0;
}

export function shortTaskBonus(task: ScorableTask): number {
  return task.estimated_minutes != null && task.estimated_minutes <= 20 ? 2 : 0;
}

/** Capped so an old, low-value task can't out-rank everything just by aging. */
export function rolloverPressure(task: ScorableTask): number {
  return Math.min(task.rollover_count, 5);
}

export function energyMismatch(
  task: ScorableTask,
  userEnergy: EnergyLevel | null,
): number {
  if (!task.energy || !userEnergy) return 0;
  return Math.abs(ENERGY_RANK[task.energy] - ENERGY_RANK[userEnergy]) * 2;
}

export type ScoringContext = {
  now: Date;
  userEnergy: EnergyLevel | null;
};

/** score = deadline urgency + priority + goal importance + short-task bonus + rollover pressure - energy mismatch (PLAN.md §7). */
export function scoreTask(task: ScorableTask, context: ScoringContext): number {
  return (
    deadlineUrgency(task, context.now) +
    priorityScore(task) +
    goalImportance(task) +
    shortTaskBonus(task) +
    rolloverPressure(task) -
    energyMismatch(task, context.userEnergy)
  );
}
