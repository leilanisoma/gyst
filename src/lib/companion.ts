/**
 * Deterministic mapping from real activity signals to the companion's
 * visual state (Phase 9C) — no manual status-setting, no AI call. Kept as
 * ordinary code per CLAUDE.md ("deterministic logic... never inside a
 * prompt") and deliberately conservative: when signals are ambiguous it
 * falls back to a neutral state rather than guessing.
 */

export type CompanionState =
  "fencing" | "studying" | "recruiting" | "resting" | "focused" | "idle";

export const COMPANION_STATE_LABELS: Record<CompanionState, string> = {
  fencing: "at fencing practice",
  studying: "deep in schoolwork",
  recruiting: "working the pipeline",
  resting: "taking it easy",
  focused: "focused",
  idle: "just hanging out",
};

type Energy = "low" | "medium" | "high";

export type CompanionSchedule = {
  title: string;
  category: "class" | "fencing" | "other";
  start_time: string;
  end_time: string;
};

export type CompanionEvent = {
  title: string;
  course_id: string | null;
  start_at: string;
  end_at: string;
};

export type CompanionSignals = {
  /** Local wall-clock time as `"HH:MM"`. */
  nowTimeOfDay: string;
  /** Current instant, ISO 8601 (same shape as `start_at`/`end_at`). */
  nowIso: string;
  todaySchedules: CompanionSchedule[];
  todayEvents: CompanionEvent[];
  /** Distinct `area` values of tasks currently `in_progress`. */
  inProgressTaskAreas: string[];
  energy: Energy | null;
  /** Any active application has a next action due today or earlier. */
  recruitingActionDueOrOverdue: boolean;
};

const FENCING_TITLE = /fenc/i;
const STUDY_TITLE =
  /\b(class|lecture|seminar|section|exam|midterm|final|quiz|lab)\b/i;

function isScheduleActiveNow(
  schedule: Pick<CompanionSchedule, "start_time" | "end_time">,
  nowTimeOfDay: string,
): boolean {
  const now = `${nowTimeOfDay}:00`;
  return schedule.start_time <= now && now < schedule.end_time;
}

function isEventActiveNow(
  event: Pick<CompanionEvent, "start_at" | "end_at">,
  nowIso: string,
): boolean {
  return event.start_at <= nowIso && nowIso < event.end_at;
}

export function deriveCompanionState(
  signals: CompanionSignals,
): CompanionState {
  const {
    nowTimeOfDay,
    nowIso,
    todaySchedules,
    todayEvents,
    inProgressTaskAreas,
    energy,
    recruitingActionDueOrOverdue,
  } = signals;

  const activeSchedule = todaySchedules.find((s) =>
    isScheduleActiveNow(s, nowTimeOfDay),
  );
  const activeEvent = todayEvents.find((e) => isEventActiveNow(e, nowIso));

  if (activeSchedule?.category === "fencing") return "fencing";
  if (activeEvent && FENCING_TITLE.test(activeEvent.title)) return "fencing";

  if (activeSchedule?.category === "class") return "studying";
  if (
    activeEvent &&
    (activeEvent.course_id !== null || STUDY_TITLE.test(activeEvent.title))
  ) {
    return "studying";
  }

  if (energy === "low") return "resting";

  if (
    recruitingActionDueOrOverdue ||
    inProgressTaskAreas.includes("recruiting")
  ) {
    return "recruiting";
  }
  if (inProgressTaskAreas.includes("school")) return "studying";
  if (inProgressTaskAreas.includes("wellness")) return "resting";
  if (inProgressTaskAreas.includes("general")) return "focused";

  return "idle";
}
