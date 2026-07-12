import { describe, expect, it } from "vitest";
import {
  daysEngagedThisWeek,
  shouldAwardReturnBonus,
  totalXp,
} from "./gamification";

describe("totalXp", () => {
  it("sums points across events", () => {
    expect(
      totalXp([
        { points: 2, occurred_on: "2026-07-01" },
        { points: 5, occurred_on: "2026-07-02" },
      ]),
    ).toBe(7);
  });

  it("returns 0 for no events", () => {
    expect(totalXp([])).toBe(0);
  });
});

describe("daysEngagedThisWeek", () => {
  it("counts distinct dates within the trailing 7-day window, inclusive", () => {
    const events = [
      { occurred_on: "2026-07-12" },
      { occurred_on: "2026-07-12" }, // same day, counts once
      { occurred_on: "2026-07-10" },
      { occurred_on: "2026-07-06" }, // exactly 6 days before, still in window
      { occurred_on: "2026-07-05" }, // 7 days before, outside window
    ];
    expect(daysEngagedThisWeek(events, "2026-07-12")).toBe(3);
  });

  it("returns 0 when there are no events", () => {
    expect(daysEngagedThisWeek([], "2026-07-12")).toBe(0);
  });
});

describe("shouldAwardReturnBonus", () => {
  it("is false for a brand-new user with no prior dates", () => {
    expect(shouldAwardReturnBonus([], "2026-07-12")).toBe(false);
  });

  it("is false when the most recent engagement was recent", () => {
    expect(shouldAwardReturnBonus(["2026-07-10"], "2026-07-12")).toBe(false);
  });

  it("is true after a week-plus gap", () => {
    expect(shouldAwardReturnBonus(["2026-07-01"], "2026-07-12")).toBe(true);
  });

  it("uses the most recent of several prior dates", () => {
    expect(
      shouldAwardReturnBonus(["2026-05-01", "2026-07-10"], "2026-07-12"),
    ).toBe(false);
  });
});
