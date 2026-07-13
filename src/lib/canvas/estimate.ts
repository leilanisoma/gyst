import type { CanvasAssignment } from "./types";

/**
 * Deterministic first-pass duration estimator (PLAN.md §15 task 6.8) —
 * ordinary code, not a prompt, per CLAUDE.md. Scales by point value where
 * Canvas reports one; falls back to a per-submission-type default when it
 * doesn't. `work_estimates.estimator_version` records "v1" so a future,
 * better estimator (e.g. one calibrated on `actual_minutes` history) can
 * coexist without losing the ability to compare versions.
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
