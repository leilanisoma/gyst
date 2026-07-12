import { describe, expect, it } from "vitest";
import {
  isFirstMiss,
  nextFeasibleSlot,
  reducedEstimate,
  reducedPriority,
} from "./rollover";

describe("isFirstMiss", () => {
  it("is true only when rollover_count is zero", () => {
    expect(isFirstMiss({ rollover_count: 0 })).toBe(true);
    expect(isFirstMiss({ rollover_count: 1 })).toBe(false);
  });
});

describe("nextFeasibleSlot", () => {
  it("advances exactly one day", () => {
    expect(nextFeasibleSlot("2026-07-11T22:00:00.000Z")).toBe(
      "2026-07-12T22:00:00.000Z",
    );
  });
});

describe("reducedPriority", () => {
  it("steps down one tier at a time and floors at low", () => {
    expect(reducedPriority("high")).toBe("medium");
    expect(reducedPriority("medium")).toBe("low");
    expect(reducedPriority("low")).toBe("low");
  });
});

describe("reducedEstimate", () => {
  it("halves the estimate but never below the actionable minimum", () => {
    expect(reducedEstimate(90)).toBe(45);
    expect(reducedEstimate(20)).toBe(15);
    expect(reducedEstimate(null)).toBeNull();
  });
});
