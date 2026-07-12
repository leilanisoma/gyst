import { describe, expect, it } from "vitest";
import {
  computeApplicationsPerWeek,
  computeMedianResponseDays,
  computeRoleFamilyConversion,
  computeSourceEffectiveness,
  computeStageFunnel,
  type AnalyticsApplication,
  type AnalyticsEvent,
} from "./recruiting-analytics";

describe("computeStageFunnel", () => {
  it("counts distinct applications reaching each milestone", () => {
    const events: AnalyticsEvent[] = [
      { application_id: "a", to_stage: "saved", occurred_at: "2026-07-01T00:00:00Z" },
      { application_id: "a", to_stage: "applied", occurred_at: "2026-07-02T00:00:00Z" },
      { application_id: "a", to_stage: "rejected", occurred_at: "2026-07-05T00:00:00Z" },
      { application_id: "b", to_stage: "saved", occurred_at: "2026-07-01T00:00:00Z" },
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
      { id: "1", stage: "saved", created_at: "2026-07-06T00:00:00Z", source: "manual", role_family: "other" },
      { id: "2", stage: "saved", created_at: "2026-07-08T00:00:00Z", source: "manual", role_family: "other" },
      { id: "3", stage: "saved", created_at: "2026-06-29T00:00:00Z", source: "manual", role_family: "other" },
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
      { application_id: "a", to_stage: "saved", occurred_at: "2026-07-01T00:00:00Z" },
      { application_id: "a", to_stage: "applied", occurred_at: "2026-07-02T00:00:00Z" },
      { application_id: "a", to_stage: "interview", occurred_at: "2026-07-06T00:00:00Z" },
      { application_id: "b", to_stage: "applied", occurred_at: "2026-07-01T00:00:00Z" },
      { application_id: "b", to_stage: "rejected", occurred_at: "2026-07-03T00:00:00Z" },
    ];
    expect(computeMedianResponseDays(events)).toBe(3);
  });

  it("ignores applications where applied is the most recent event", () => {
    const events: AnalyticsEvent[] = [
      { application_id: "a", to_stage: "saved", occurred_at: "2026-07-01T00:00:00Z" },
      { application_id: "a", to_stage: "applied", occurred_at: "2026-07-02T00:00:00Z" },
    ];
    expect(computeMedianResponseDays(events)).toBeNull();
  });
});

describe("group effectiveness", () => {
  const apps: AnalyticsApplication[] = [
    { id: "1", stage: "offer", created_at: "2026-07-01T00:00:00Z", source: "manual", role_family: "product_management" },
    { id: "2", stage: "saved", created_at: "2026-07-01T00:00:00Z", source: "manual", role_family: "product_management" },
    { id: "3", stage: "applied", created_at: "2026-07-01T00:00:00Z", source: "referral", role_family: "other" },
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
