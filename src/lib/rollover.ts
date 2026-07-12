import type { TaskPriority } from "./tasks";

/** A task is reviewed for the first time when it has never rolled over before. */
export function isFirstMiss(task: { rollover_count: number }): boolean {
  return task.rollover_count === 0;
}

/** Next-day heuristic for "the next feasible slot" — a full re-run of the scheduling engine is a later refinement. */
export function nextFeasibleSlot(dueDateIso: string): string {
  return new Date(
    new Date(dueDateIso).getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();
}

const PRIORITY_STEP_DOWN: Record<TaskPriority, TaskPriority> = {
  high: "medium",
  medium: "low",
  low: "low",
};

/** One step down; low stays low rather than looping back to high. */
export function reducedPriority(priority: TaskPriority): TaskPriority {
  return PRIORITY_STEP_DOWN[priority];
}

/** Halves the estimate, never below a still-actionable minimum. */
export function reducedEstimate(minutes: number | null): number | null {
  if (minutes == null) return null;
  return Math.max(15, Math.round(minutes / 2));
}
