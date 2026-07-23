import {
  APPLICATION_BOARD_STAGES,
  APPLICATION_STAGE_LABELS,
  type ApplicationStage,
  type RoleFamily,
} from "@/lib/recruiting";

export type AnalyticsApplication = {
  id: string;
  stage: ApplicationStage;
  created_at: string;
  source: string;
  role_family: RoleFamily;
  excluded: boolean;
};

export type AnalyticsEvent = {
  application_id: string;
  to_stage: string;
  occurred_at: string;
};

/** Funnel milestones worth reporting — excludes the negative-outcome stages. */
const FUNNEL_STAGES = APPLICATION_BOARD_STAGES.filter((s) => s !== "rejected");

/**
 * `FUNNEL_STAGES`' order doubles as the pipeline's forward progression —
 * used to credit an application with reaching an earlier milestone (e.g.
 * `applied`) even when the user jumped the stage dropdown straight to a
 * later one (e.g. `interview`) without ever explicitly selecting `applied`
 * first. Without this, that application would never show a `to_stage:
 * "applied"` event at all and every applied-based metric would silently
 * miss it.
 */
const PROGRESSION_RANK = new Map<ApplicationStage, number>(
  FUNNEL_STAGES.map((stage, index) => [stage, index]),
);

/** Earliest `occurred_at` per application at which it reached `milestone` or any later stage. */
function firstReachedDates(
  events: AnalyticsEvent[],
  milestone: ApplicationStage,
): Map<string, string> {
  const targetRank = PROGRESSION_RANK.get(milestone) ?? Infinity;
  const firstByApplication = new Map<string, string>();
  for (const event of events) {
    const rank = PROGRESSION_RANK.get(event.to_stage as ApplicationStage);
    if (rank === undefined || rank < targetRank) continue;
    const existing = firstByApplication.get(event.application_id);
    if (!existing || event.occurred_at < existing) {
      firstByApplication.set(event.application_id, event.occurred_at);
    }
  }
  return firstByApplication;
}

export type FunnelStep = { stage: ApplicationStage; label: string; reached: number };

/** For each milestone, how many applications ever reached it or a later stage. */
export function computeStageFunnel(events: AnalyticsEvent[]): FunnelStep[] {
  return FUNNEL_STAGES.map((stage) => ({
    stage,
    label: APPLICATION_STAGE_LABELS[stage],
    reached: firstReachedDates(events, stage).size,
  }));
}

export type WeeklyCount = { weekStart: string; count: number };

/**
 * Applications reaching `applied` (or skipping straight past it to a later
 * stage) per ISO week, oldest first, for the last `weeks` weeks — each
 * application counts once, in the week it first qualified, not once per
 * qualifying event.
 */
export function computeApplicationsPerWeek(
  events: AnalyticsEvent[],
  weeks: number,
  now: Date = new Date(),
): WeeklyCount[] {
  const weekStarts: string[] = [];
  const cursor = startOfWeek(now);
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weekStarts.push(d.toISOString().slice(0, 10));
  }

  const counts = new Map(weekStarts.map((w) => [w, 0]));
  for (const occurredAt of firstReachedDates(events, "applied").values()) {
    const week = startOfWeek(new Date(occurredAt)).toISOString().slice(0, 10);
    if (counts.has(week)) {
      counts.set(week, (counts.get(week) ?? 0) + 1);
    }
  }

  return weekStarts.map((weekStart) => ({
    weekStart,
    count: counts.get(weekStart) ?? 0,
  }));
}

export function startOfWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

/** Median days between an "applied" event and the application's next stage event. */
export function computeMedianResponseDays(events: AnalyticsEvent[]): number | null {
  const byApplication = new Map<string, AnalyticsEvent[]>();
  for (const event of events) {
    const list = byApplication.get(event.application_id) ?? [];
    list.push(event);
    byApplication.set(event.application_id, list);
  }

  const responseDays: number[] = [];
  for (const list of byApplication.values()) {
    const sorted = [...list].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
    const appliedIndex = sorted.findIndex((e) => e.to_stage === "applied");
    if (appliedIndex === -1 || appliedIndex === sorted.length - 1) continue;
    const appliedAt = new Date(sorted[appliedIndex].occurred_at).getTime();
    const nextAt = new Date(sorted[appliedIndex + 1].occurred_at).getTime();
    responseDays.push((nextAt - appliedAt) / 86_400_000);
  }

  if (responseDays.length === 0) return null;
  const sorted = [...responseDays].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export type GroupEffectiveness = {
  key: string;
  total: number;
  appliedOrBeyond: number;
  offers: number;
};

const APPLIED_OR_BEYOND = new Set<ApplicationStage>([
  "applied",
  "assessment",
  "recruiter_screen",
  "interview",
  "final_round",
  "offer",
  "rejected",
]);

function groupBy(
  applications: AnalyticsApplication[],
  key: (app: AnalyticsApplication) => string,
): GroupEffectiveness[] {
  const groups = new Map<string, GroupEffectiveness>();
  for (const app of applications) {
    const k = key(app);
    const group = groups.get(k) ?? { key: k, total: 0, appliedOrBeyond: 0, offers: 0 };
    group.total += 1;
    if (APPLIED_OR_BEYOND.has(app.stage)) group.appliedOrBeyond += 1;
    if (app.stage === "offer") group.offers += 1;
    groups.set(k, group);
  }
  return Array.from(groups.values()).sort((a, b) => b.total - a.total);
}

export function computeSourceEffectiveness(
  applications: AnalyticsApplication[],
): GroupEffectiveness[] {
  return groupBy(applications, (app) => app.source);
}

export function computeRoleFamilyConversion(
  applications: AnalyticsApplication[],
): GroupEffectiveness[] {
  return groupBy(applications, (app) => app.role_family);
}

export type SourceCoverage = {
  key: string;
  total: number;
  excluded: number;
  relevanceRate: number;
};

/**
 * PLAN.md §15 Phase 5 exit criteria: "at least 80% of surfaced roles are
 * plausibly relevant." `excluded` here is the same hard-exclusion flag
 * `scoreOpportunity` already computes (closed/pure-SWE/pure-finance/
 * ineligible-grad-year) — this is the measurement task 5.9 asks for before
 * evaluating a paid search API, not a new relevance heuristic.
 */
export function computeSourceCoverage(applications: AnalyticsApplication[]): SourceCoverage[] {
  const groups = new Map<string, { total: number; excluded: number }>();
  for (const app of applications) {
    const group = groups.get(app.source) ?? { total: 0, excluded: 0 };
    group.total += 1;
    if (app.excluded) group.excluded += 1;
    groups.set(app.source, group);
  }
  return Array.from(groups.entries())
    .map(([key, { total, excluded }]) => ({
      key,
      total,
      excluded,
      relevanceRate: total > 0 ? (total - excluded) / total : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Days with no movement before an `applied` application counts as gone quiet, not just slow. */
export const GHOSTED_THRESHOLD_DAYS = 60;

/**
 * True when an application has sat in `applied` with no further stage
 * transition for `GHOSTED_THRESHOLD_DAYS`+ — a real recruiter silently
 * dropping contact, distinct from "rejected" (an explicit outcome) or just
 * "slow" (under the threshold). Only ever true for `applied`, since any
 * other current stage means a later event already fired.
 */
export function isGhosted(
  application: { id: string; stage: ApplicationStage },
  events: AnalyticsEvent[],
  now: Date = new Date(),
): boolean {
  if (application.stage !== "applied") return false;
  const own = events.filter((e) => e.application_id === application.id);
  if (own.length === 0) return false;
  const latest = own.reduce(
    (max, e) => (e.occurred_at > max ? e.occurred_at : max),
    own[0].occurred_at,
  );
  const daysSince = (now.getTime() - new Date(latest).getTime()) / 86_400_000;
  return daysSince >= GHOSTED_THRESHOLD_DAYS;
}

export type WeeklyGoalProgress = {
  goal: number;
  actual: number;
  pace: "ahead" | "on_track" | "behind";
};

/**
 * This week's count of applications that actually reached `applied` or
 * skipped straight past it to a later stage (Monday-anchored, by the
 * earliest qualifying transition event, not by `created_at` — an
 * opportunity can sit `saved` for weeks before it's actually submitted, so
 * `created_at` would measure "added to pipeline," not "applied") against
 * the user's goal — feeds the dashboard's goal meter. "on_track" allows a
 * small buffer (1 short of goal) so an ordinary Tuesday doesn't read as
 * "behind."
 */
export function computeWeeklyGoalProgress(
  events: AnalyticsEvent[],
  goal: number,
  now: Date = new Date(),
): WeeklyGoalProgress {
  const weekStart = startOfWeek(now).toISOString().slice(0, 10);
  const actual = [...firstReachedDates(events, "applied").values()].filter(
    (occurredAt) => occurredAt.slice(0, 10) >= weekStart,
  ).length;
  const pace: WeeklyGoalProgress["pace"] =
    actual >= goal ? "ahead" : actual >= goal - 1 ? "on_track" : "behind";
  return { goal, actual, pace };
}
