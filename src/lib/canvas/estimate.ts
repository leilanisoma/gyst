import type { CanvasAssignment } from "./types";

/**
 * Deterministic first-pass duration estimator (PLAN.md §15 task 6.8) —
 * ordinary code, not a prompt, per CLAUDE.md. Scales by point value where
 * Canvas reports one; falls back to a per-submission-type default when it
 * doesn't. This is the "v1" base estimate — `calibrateEstimateMinutes`
 * below is what actually gets stored once real history exists.
 */
export function estimateAssignmentMinutes(assignment: CanvasAssignment): number {
  if (assignment.points_possible != null && assignment.points_possible > 0) {
    return Math.min(240, Math.max(30, Math.round(assignment.points_possible * 10)));
  }

  const types = assignment.submission_types ?? [];
  if (types.includes("online_quiz")) return 30;
  if (types.includes("discussion_topic")) return 20;
  if (types.includes("online_upload") || types.includes("online_text_entry")) return 90;
  return 60;
}

export type EstimateCategory = "quiz" | "discussion" | "written" | "other";

/**
 * Groups assignments by *kind of work* rather than by the point-value branch
 * `estimateAssignmentMinutes` takes — a recurring weekly quiz should
 * calibrate against other weekly quizzes in the same course even though
 * quizzes usually carry `points_possible` and would otherwise fall into the
 * same points-scaling bucket as an unrelated essay worth the same points.
 */
export function categorizeAssignment(assignment: CanvasAssignment): EstimateCategory {
  const types = assignment.submission_types ?? [];
  if (types.includes("online_quiz")) return "quiz";
  if (types.includes("discussion_topic")) return "discussion";
  if (types.includes("online_upload") || types.includes("online_text_entry")) return "written";
  return "other";
}

export type PriorEstimate = { predicted_minutes: number; actual_minutes: number };

/**
 * Calibration layer (PLAN.md §15 task 6.8's "future estimator version")
 * applied on top of the deterministic v1 base estimate: multiplies it by
 * the average actual/predicted ratio observed across prior same-course,
 * same-category assignments with logged actual time — so a recurring
 * weekly quiz that always runs shorter or longer than predicted keeps
 * adjusting toward reality every time another one gets logged, no waiting
 * for a hand-tuned v2 heuristic. Ratio is clamped to [0.25x, 4x] so a single
 * mis-typed actual-minutes entry can't swing every future estimate for that
 * course/category; result rounds to the nearest 5 minutes. Returns the
 * unmodified base estimate when there's no history yet for this bucket.
 */
export function calibrateEstimateMinutes(
  baseMinutes: number,
  priorEstimates: PriorEstimate[],
): number {
  if (priorEstimates.length === 0) return baseMinutes;

  const ratios = priorEstimates.map(
    (estimate) => estimate.actual_minutes / estimate.predicted_minutes,
  );
  const averageRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  const clampedRatio = Math.min(4, Math.max(0.25, averageRatio));

  return Math.max(5, Math.round((baseMinutes * clampedRatio) / 5) * 5);
}
