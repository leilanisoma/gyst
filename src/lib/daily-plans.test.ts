import { describe, expect, it } from "vitest";
import { nonEmptyOutcomes } from "./daily-plans";

describe("nonEmptyOutcomes", () => {
  it("returns an empty array for a null plan", () => {
    expect(nonEmptyOutcomes(null)).toEqual([]);
  });

  it("drops blank and whitespace-only outcomes, preserving order", () => {
    const plan = {
      id: "1",
      plan_date: "2026-07-12",
      outcome_1: "Ship the review flow",
      outcome_2: "  ",
      outcome_3: "Reply to recruiter",
    };
    expect(nonEmptyOutcomes(plan)).toEqual([
      "Ship the review flow",
      "Reply to recruiter",
    ]);
  });
});
