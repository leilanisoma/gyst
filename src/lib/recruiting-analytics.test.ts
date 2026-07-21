import { describe, expect, it } from "vitest";
import {
  computeApplicationsPerWeek,
  computeMedianResponseDays,
  computeRoleFamilyConversion,
  computeSourceCoverage,
  computeSourceEffectiveness,
  computeStageFunnel,
  computeWeeklyGoalProgress,
  isGhosted,
  type AnalyticsApplication,
  type AnalyticsEvent,
} from "./recruiting-analytics";

describe("computeStageFunnel", () => {
  it("counts distinct applications reaching each milestone", () => {
    const events: AnalyticsEvent[] = [
      {
        application_id: "a",
        to_stage: "saved",
        occurred_at: "2026-07-01T00:00:00Z",
      },
      {
        application_id: "a",
        to_stage: "applied",
        occurred_at: "2026-07-02T00:00:00Z",
      },
      {
        application_id: "a",
        to_stage: "rejected",
        occurred_at: "2026-07-05T00:00:00Z",
      },
      {
        application_id: "b",
        to_stage: "saved",
        occurred_at: "2026-07-01T00:00:00Z",
      },
    ];
    const funnel = computeStageFunnel(events);
    expect(funnel.find((f) => f.stage === "saved")?.reached).toBe(2);
    expect(funnel.find((f) => f.stage === "applied")?.reached).toBe(1);
    expect(funnel.find((f) => f.stage === "interview")?.reached).toBe(0);
  });
});

describe("computeApplicationsPerWeek", () => {
  it("buckets applications into ISO weeks", () => {
    const apps: AnalyticsApplication[] = [
      {
        id: "1",
        stage: "saved",
        created_at: "2026-07-06T00:00:00Z",
        source: "manual",
        role_family: "other",
        excluded: false,
      },
      {
        id: "2",
        stage: "saved",
        created_at: "2026-07-08T00:00:00Z",
        source: "manual",
        role_family: "other",
        excluded: false,
      },
      {
        id: "3",
        stage: "saved",
        created_at: "2026-06-29T00:00:00Z",
        source: "manual",
        role_family: "other",
        excluded: false,
      },
    ];
    const now = new Date("2026-07-12T00:00:00Z");
    const weeks = computeApplicationsPerWeek(apps, 3, now);
    expect(weeks).toHaveLength(3);
    // 2026-07-06 (Monday) and 2026-07-08 fall in the same week.
    expect(weeks[weeks.length - 1].count).toBe(2);
    expect(weeks[weeks.length - 2].count).toBe(1);
  });
});

describe("computeMedianResponseDays", () => {
  it("returns null with no applied transitions", () => {
    expect(computeMedianResponseDays([])).toBeNull();
  });

  it("computes the median days between applied and the next event", () => {
    const events: AnalyticsEvent[] = [
      {
        application_id: "a",
        to_stage: "saved",
        occurred_at: "2026-07-01T00:00:00Z",
      },
      {
        application_id: "a",
        to_stage: "applied",
        occurred_at: "2026-07-02T00:00:00Z",
      },
      {
        application_id: "a",
        to_stage: "interview",
        occurred_at: "2026-07-06T00:00:00Z",
      },
      {
        application_id: "b",
        to_stage: "applied",
        occurred_at: "2026-07-01T00:00:00Z",
      },
      {
        application_id: "b",
        to_stage: "rejected",
        occurred_at: "2026-07-03T00:00:00Z",
      },
    ];
    expect(computeMedianResponseDays(events)).toBe(3);
  });

  it("ignores applications where applied is the most recent event", () => {
    const events: AnalyticsEvent[] = [
      {
        application_id: "a",
        to_stage: "saved",
        occurred_at: "2026-07-01T00:00:00Z",
      },
      {
        application_id: "a",
        to_stage: "applied",
        occurred_at: "2026-07-02T00:00:00Z",
      },
    ];
    expect(computeMedianResponseDays(events)).toBeNull();
  });
});

describe("group effectiveness", () => {
  const apps: AnalyticsApplication[] = [
    {
      id: "1",
      stage: "offer",
      created_at: "2026-07-01T00:00:00Z",
      source: "manual",
      role_family: "product_management",
      excluded: false,
    },
    {
      id: "2",
      stage: "saved",
      created_at: "2026-07-01T00:00:00Z",
      source: "manual",
      role_family: "product_management",
      excluded: false,
    },
    {
      id: "3",
      stage: "applied",
      created_at: "2026-07-01T00:00:00Z",
      source: "referral",
      role_family: "other",
      excluded: false,
    },
  ];

  it("groups by source", () => {
    const bySource = computeSourceEffectiveness(apps);
    const manual = bySource.find((g) => g.key === "manual");
    expect(manual?.total).toBe(2);
    expect(manual?.appliedOrBeyond).toBe(1);
    expect(manual?.offers).toBe(1);
  });

  it("groups by role family", () => {
    const byFamily = computeRoleFamilyConversion(apps);
    const pm = byFamily.find((g) => g.key === "product_management");
    expect(pm?.total).toBe(2);
    expect(pm?.offers).toBe(1);
  });
});

describe("computeSourceCoverage", () => {
  it("computes a relevance rate per source from the excluded flag", () => {
    const apps: AnalyticsApplication[] = [
      {
        id: "1",
        stage: "discovered",
        created_at: "2026-07-01T00:00:00Z",
        source: "greenhouse",
        role_family: "other",
        excluded: false,
      },
      {
        id: "2",
        stage: "discovered",
        created_at: "2026-07-01T00:00:00Z",
        source: "greenhouse",
        role_family: "other",
        excluded: true,
      },
      {
        id: "3",
        stage: "discovered",
        created_at: "2026-07-01T00:00:00Z",
        source: "greenhouse",
        role_family: "other",
        excluded: true,
      },
      {
        id: "4",
        stage: "discovered",
        created_at: "2026-07-01T00:00:00Z",
        source: "greenhouse",
        role_family: "other",
        excluded: true,
      },
      {
        id: "5",
        stage: "discovered",
        created_at: "2026-07-01T00:00:00Z",
        source: "greenhouse",
        role_family: "other",
        excluded: true,
      },
      {
        id: "6",
        stage: "discovered",
        created_at: "2026-07-01T00:00:00Z",
        source: "curated_feed",
        role_family: "other",
        excluded: false,
      },
    ];

    const coverage = computeSourceCoverage(apps);
    const greenhouse = coverage.find((c) => c.key === "greenhouse");
    const curated = coverage.find((c) => c.key === "curated_feed");

    expect(greenhouse).toMatchObject({
      total: 5,
      excluded: 4,
      relevanceRate: 0.2,
    });
    expect(curated).toMatchObject({ total: 1, excluded: 0, relevanceRate: 1 });
  });

  it("returns an empty array for no applications", () => {
    expect(computeSourceCoverage([])).toEqual([]);
  });
});

describe("isGhosted", () => {
  const now = new Date("2026-07-21T00:00:00Z");

  it("is true only for 'applied' with no movement in 60+ days", () => {
    const events: AnalyticsEvent[] = [
      { application_id: "a", to_stage: "applied", occurred_at: "2026-05-01T00:00:00Z" },
    ];
    expect(isGhosted({ id: "a", stage: "applied" }, events, now)).toBe(true);
  });

  it("is false when still within the threshold", () => {
    const events: AnalyticsEvent[] = [
      { application_id: "a", to_stage: "applied", occurred_at: "2026-07-01T00:00:00Z" },
    ];
    expect(isGhosted({ id: "a", stage: "applied" }, events, now)).toBe(false);
  });

  it("is false for any stage other than 'applied', even if stale", () => {
    const events: AnalyticsEvent[] = [
      { application_id: "a", to_stage: "rejected", occurred_at: "2026-01-01T00:00:00Z" },
    ];
    expect(isGhosted({ id: "a", stage: "rejected" }, events, now)).toBe(false);
  });

  it("is false with no event history at all", () => {
    expect(isGhosted({ id: "a", stage: "applied" }, [], now)).toBe(false);
  });
});

describe("computeWeeklyGoalProgress", () => {
  // 2026-07-21 is a Tuesday; that week starts Monday 2026-07-20.
  const now = new Date("2026-07-21T00:00:00Z");

  it("counts distinct applications that reached 'applied' this week", () => {
    const events: AnalyticsEvent[] = [
      { application_id: "a", to_stage: "applied", occurred_at: "2026-07-20T00:00:00Z" },
      { application_id: "b", to_stage: "applied", occurred_at: "2026-07-21T00:00:00Z" },
      { application_id: "b", to_stage: "interview", occurred_at: "2026-07-21T01:00:00Z" },
      { application_id: "c", to_stage: "applied", occurred_at: "2026-07-10T00:00:00Z" }, // last week
    ];
    expect(computeWeeklyGoalProgress(events, 5, now)).toEqual({
      goal: 5,
      actual: 2,
      pace: "behind",
    });
  });

  it("reports on_track within one of goal, ahead at/above it", () => {
    const events: AnalyticsEvent[] = Array.from({ length: 4 }, (_, i) => ({
      application_id: `a${i}`,
      to_stage: "applied",
      occurred_at: "2026-07-20T00:00:00Z",
    }));
    expect(computeWeeklyGoalProgress(events, 5, now).pace).toBe("on_track");

    events.push({ application_id: "a4", to_stage: "applied", occurred_at: "2026-07-20T00:00:00Z" });
    expect(computeWeeklyGoalProgress(events, 5, now).pace).toBe("ahead");
  });
});
