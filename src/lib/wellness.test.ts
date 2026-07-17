import { describe, expect, it } from "vitest";
import { weeklyTrendObservations, type WellnessCheckIn } from "./wellness";

function checkIn(
  date: string,
  overrides: Partial<WellnessCheckIn> = {},
): WellnessCheckIn {
  return {
    id: date,
    check_in_date: date,
    energy: null,
    mood: null,
    stress: null,
    sleep_perception: null,
    ate_consistently: null,
    recovery: null,
    note: null,
    ...overrides,
  };
}

describe("weeklyTrendObservations", () => {
  const today = "2026-07-15";

  it("returns nothing when there are no check-ins", () => {
    expect(weeklyTrendObservations([], today)).toEqual([]);
  });

  it("returns nothing for a single off day (no repeated pattern)", () => {
    const checkIns = [checkIn(today, { energy: "low" })];
    expect(weeklyTrendObservations(checkIns, today)).toEqual([]);
  });

  it("reports an observation once a signal repeats twice within the week", () => {
    const checkIns = [
      checkIn("2026-07-14", { energy: "low" }),
      checkIn(today, { energy: "low" }),
    ];
    const observations = weeklyTrendObservations(checkIns, today);
    expect(observations).toEqual([
      "Energy was logged as low on 2 of the 2 days you checked in this week.",
    ]);
  });

  it("ignores check-ins outside the trailing 7-day window", () => {
    const checkIns = [
      checkIn("2026-07-01", { energy: "low" }),
      checkIn("2026-07-02", { energy: "low" }),
      checkIn(today, { energy: "low" }),
    ];
    // Only one of the three falls inside [2026-07-09, 2026-07-15].
    expect(weeklyTrendObservations(checkIns, today)).toEqual([]);
  });

  it("counts only non-null entries as 'logged' for a field", () => {
    const checkIns = [
      checkIn("2026-07-13"),
      checkIn("2026-07-14", { sleep_perception: "poor" }),
      checkIn(today, { sleep_perception: "poor" }),
    ];
    const observations = weeklyTrendObservations(checkIns, today);
    expect(observations).toEqual([
      "Sleep felt short or poor on 2 of the 2 days you checked in this week.",
    ]);
  });

  it("combines multiple fields' signal values (mood: low or rough)", () => {
    const checkIns = [
      checkIn("2026-07-14", { mood: "low" }),
      checkIn(today, { mood: "rough" }),
    ];
    const observations = weeklyTrendObservations(checkIns, today);
    expect(observations).toEqual([
      "Mood leaned low on 2 of the 2 days you checked in this week.",
    ]);
  });

  it("surfaces multiple independent observations at once", () => {
    const checkIns = [
      checkIn("2026-07-14", { stress: "high", ate_consistently: "no" }),
      checkIn(today, { stress: "high", ate_consistently: "somewhat" }),
    ];
    const observations = weeklyTrendObservations(checkIns, today);
    expect(observations).toHaveLength(2);
    expect(observations[0]).toContain("Stress was logged as high");
    expect(observations[1]).toContain("Eating felt inconsistent");
  });

  it("never returns causal or diagnostic language, only counts", () => {
    const checkIns = [
      checkIn("2026-07-14", { recovery: "poor" }),
      checkIn(today, { recovery: "poor" }),
    ];
    const [observation] = weeklyTrendObservations(checkIns, today);
    expect(observation).not.toMatch(/diagnos|caus|disorder|deficien/i);
  });
});
