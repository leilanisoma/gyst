import { describe, expect, it } from "vitest";
import {
  calibrateEstimateMinutes,
  categorizeAssignment,
  estimateAssignmentMinutes,
} from "./estimate";
import type { CanvasAssignment } from "./types";

function assignment(overrides: Partial<CanvasAssignment> = {}): CanvasAssignment {
  return {
    id: 1,
    name: "Test assignment",
    due_at: null,
    points_possible: null,
    submission_types: null,
    html_url: "https://canvas.example.com/1",
    ...overrides,
  };
}

describe("estimateAssignmentMinutes", () => {
  it("scales with point value, clamped to [30, 240]", () => {
    expect(estimateAssignmentMinutes(assignment({ points_possible: 5 }))).toBe(50);
    expect(estimateAssignmentMinutes(assignment({ points_possible: 1 }))).toBe(30);
    expect(estimateAssignmentMinutes(assignment({ points_possible: 100 }))).toBe(240);
  });

  it("falls back to a per-submission-type default with no points", () => {
    expect(
      estimateAssignmentMinutes(assignment({ submission_types: ["online_quiz"] })),
    ).toBe(30);
    expect(
      estimateAssignmentMinutes(assignment({ submission_types: ["discussion_topic"] })),
    ).toBe(20);
    expect(
      estimateAssignmentMinutes(assignment({ submission_types: ["online_upload"] })),
    ).toBe(90);
    expect(estimateAssignmentMinutes(assignment({ submission_types: [] }))).toBe(60);
  });
});

describe("categorizeAssignment", () => {
  it("categorizes by submission type regardless of points", () => {
    expect(
      categorizeAssignment(assignment({ submission_types: ["online_quiz"], points_possible: 10 })),
    ).toBe("quiz");
    expect(
      categorizeAssignment(assignment({ submission_types: ["discussion_topic"] })),
    ).toBe("discussion");
    expect(
      categorizeAssignment(assignment({ submission_types: ["online_text_entry"] })),
    ).toBe("written");
    expect(categorizeAssignment(assignment({ submission_types: [] }))).toBe("other");
  });
});

describe("calibrateEstimateMinutes", () => {
  it("returns the base estimate unchanged with no prior history", () => {
    expect(calibrateEstimateMinutes(30, [])).toBe(30);
  });

  it("adjusts toward the observed actual/predicted ratio", () => {
    // Past quizzes predicted 30, actually took 15 (0.5x) — recurring weekly
    // quiz that consistently runs short.
    const result = calibrateEstimateMinutes(30, [
      { predicted_minutes: 30, actual_minutes: 15 },
    ]);
    expect(result).toBe(15);
  });

  it("averages the ratio across multiple prior data points", () => {
    const result = calibrateEstimateMinutes(60, [
      { predicted_minutes: 60, actual_minutes: 90 }, // 1.5x
      { predicted_minutes: 60, actual_minutes: 30 }, // 0.5x
    ]);
    // average ratio 1.0x -> unchanged
    expect(result).toBe(60);
  });

  it("clamps an extreme ratio so one bad data point can't swing estimates wildly", () => {
    const overshoot = calibrateEstimateMinutes(30, [
      { predicted_minutes: 30, actual_minutes: 300 }, // 10x
    ]);
    expect(overshoot).toBe(120); // clamped to 4x

    const undershoot = calibrateEstimateMinutes(60, [
      { predicted_minutes: 60, actual_minutes: 1 }, // ~0.017x
    ]);
    expect(undershoot).toBe(15); // clamped to 0.25x
  });

  it("never returns less than 5 minutes", () => {
    const result = calibrateEstimateMinutes(10, [
      { predicted_minutes: 10, actual_minutes: 1 },
    ]);
    expect(result).toBeGreaterThanOrEqual(5);
  });

  it("rounds to the nearest 5 minutes", () => {
    // 44 * (13/10 ratio) = 57.2 -> rounds to 55, not the raw 57.2.
    const result = calibrateEstimateMinutes(44, [
      { predicted_minutes: 10, actual_minutes: 13 },
    ]);
    expect(result).toBe(55);
  });
});
