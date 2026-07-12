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
};

export type AnalyticsEvent = {
  application_id: string;
  to_stage: string;
  occurred_at: string;
};

/** Funnel milestones worth reporting — excludes the negative-outcome stages. */
const FUNNEL_STAGES = APPLICATION_BOARD_STAGES.filter((s) => s !== "rejected");

export type FunnelStep = { stage: ApplicationStage; label: string; reached: number };

/** For each milestone, how many applications ever had an event transitioning into it. */
export function computeStageFunnel(events: AnalyticsEvent[]): FunnelStep[] {
  return FUNNEL_STAGES.map((stage) => {
    const reached = new Set(
      events.filter((e) => e.to_stage === stage).map((e) => e.application_id),
    ).size;
    return { stage, label: APPLICATION_STAGE_LABELS[stage], reached };
  });
}

export type WeeklyCount = { weekStart: string; count: number };

/** Applications created per ISO week, oldest first, for the last `weeks` weeks. */
export function computeApplicationsPerWeek(
  applications: AnalyticsApplication[],
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
  for (const app of applications) {
    const week = startOfWeek(new Date(app.created_at)).toISOString().slice(0, 10);
    if (counts.has(week)) {
      counts.set(week, (counts.get(week) ?? 0) + 1);
    }
  }

  return weekStarts.map((weekStart) => ({
    weekStart,
    count: counts.get(weekStart) ?? 0,
  }));
}

function startOfWeek(date: Date): Date {
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
