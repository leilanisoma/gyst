import type { CanvasAssignment } from "./types";
import type { AssessmentKind } from "@/lib/assessments";

export type AssessmentCandidate = { kind: AssessmentKind; confidence: number };

// Word-boundary-aware so "final" doesn't match "finalize" and "exam" doesn't
// match "example" — same lesson `job-sources/classify.ts` learned catching
// "International" matching a naive /intern/i.
const KIND_PATTERNS: { kind: AssessmentKind; pattern: RegExp }[] = [
  { kind: "final", pattern: /\bfinal(\s+exam)?\b/i },
  // A standalone "exam" (not already matched as "final exam" above) reads
  // as midterm-tier — Canvas has no separate "exam" kind in this schema.
  { kind: "midterm", pattern: /\bmid[- ]?term\b|\bexam\b/i },
  { kind: "presentation", pattern: /\bpresentation\b/i },
  { kind: "project", pattern: /\bproject\b/i },
  { kind: "quiz", pattern: /\bquiz\b/i },
];

// Below this, a title match alone is still a candidate but at lower
// confidence — a 2-point weekly quiz named "Quiz 3" is technically a quiz
// but not the kind of thing worth a prep-status/countdown entry.
const POINTS_THRESHOLD = 20;
// A large point value with no keyword match at all is still worth flagging
// (a big untitled deliverable), just at low confidence.
const HIGH_VALUE_FALLBACK_THRESHOLD = 100;

/**
 * Deterministic classifier (PLAN.md §15 task 6.4) — ordinary code, not a
 * prompt, per CLAUDE.md. Every match still requires user confirmation
 * before it counts as a real assessment (`assessments.confirmed`); this
 * only decides what's worth *asking about*.
 */
export function classifyAssessmentCandidate(
  assignment: Pick<CanvasAssignment, "name" | "points_possible">,
): AssessmentCandidate | null {
  const highValue = (assignment.points_possible ?? 0) >= POINTS_THRESHOLD;

  for (const { kind, pattern } of KIND_PATTERNS) {
    if (pattern.test(assignment.name)) {
      return { kind, confidence: highValue ? 0.9 : 0.7 };
    }
  }

  if ((assignment.points_possible ?? 0) >= HIGH_VALUE_FALLBACK_THRESHOLD) {
    return { kind: "other", confidence: 0.5 };
  }

  return null;
}
