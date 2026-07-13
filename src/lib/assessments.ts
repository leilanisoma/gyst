export type ActionResult = { ok: true } | { ok: false; error: string };

export type AssessmentKind = "quiz" | "midterm" | "final" | "presentation" | "project" | "other";

export const ASSESSMENT_KINDS: AssessmentKind[] = [
  "quiz",
  "midterm",
  "final",
  "presentation",
  "project",
  "other",
];

export const ASSESSMENT_KIND_LABELS: Record<AssessmentKind, string> = {
  quiz: "Quiz",
  midterm: "Midterm",
  final: "Final",
  presentation: "Presentation",
  project: "Project",
  other: "Other",
};

export type AssessmentPreparationStatus = "not_started" | "in_progress" | "ready";

export const ASSESSMENT_PREPARATION_STATUSES: AssessmentPreparationStatus[] = [
  "not_started",
  "in_progress",
  "ready",
];

export const ASSESSMENT_PREPARATION_STATUS_LABELS: Record<AssessmentPreparationStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  ready: "Ready",
};
