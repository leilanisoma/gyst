import { describe, expect, it } from "vitest";
import { schoolGrowthStage, schoolTaskCompletionRate } from "./school-growth";

describe("schoolTaskCompletionRate", () => {
  it("returns 0 when there are no school tasks yet", () => {
    expect(schoolTaskCompletionRate([])).toBe(0);
  });

  it("returns the fraction of tasks marked completed", () => {
    const tasks = [
      { status: "completed" },
      { status: "completed" },
      { status: "in_progress" },
      { status: "not_started" },
    ];
    expect(schoolTaskCompletionRate(tasks)).toBe(0.5);
  });

  it("returns 1 when every task is completed", () => {
    expect(schoolTaskCompletionRate([{ status: "completed" }])).toBe(1);
  });
});

describe("schoolGrowthStage", () => {
  it("is stage 0 at 0% completion", () => {
    expect(schoolGrowthStage(0)).toBe(0);
  });

  it("steps up at each quarter threshold", () => {
    expect(schoolGrowthStage(0.25)).toBe(1);
    expect(schoolGrowthStage(0.5)).toBe(2);
    expect(schoolGrowthStage(0.75)).toBe(3);
    expect(schoolGrowthStage(1)).toBe(4);
  });

  it("never exceeds stage 4", () => {
    expect(schoolGrowthStage(1)).toBe(4);
  });

  it("falls back to the highest threshold met, not the exact match", () => {
    expect(schoolGrowthStage(0.6)).toBe(2);
    expect(schoolGrowthStage(0.9)).toBe(3);
  });
});
