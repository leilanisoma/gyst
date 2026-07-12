import { describe, expect, it } from "vitest";
import { scoreOpportunity } from "./job-scoring";

const now = new Date("2026-07-12T00:00:00Z");

const base = {
  roleFamily: "product_management" as const,
  isSwe: false,
  isFinance: false,
  active: true,
  eligibleGradYears: [] as number[],
  targetGradYear: 2027,
  established: false,
  deadline: null as string | null,
};

describe("scoreOpportunity", () => {
  it("scores a well-matched target-family role with defaults", () => {
    const result = scoreOpportunity(base, now);
    expect(result.excluded).toBe(false);
    expect(result.roleFamily).toBe(25);
    expect(result.eligibility).toBe(12); // unknown eligibility, no hard exclusion
    expect(result.total).toBe(25 + 10 + 12 + 5 + 0 + 1 + 3);
  });

  it("gives full eligibility credit when the target grad year is listed", () => {
    const result = scoreOpportunity(
      { ...base, eligibleGradYears: [2026, 2027, 2028] },
      now,
    );
    expect(result.eligibility).toBe(20);
    expect(result.excluded).toBe(false);
  });

  it("hard-excludes an ineligible graduation year", () => {
    const result = scoreOpportunity({ ...base, eligibleGradYears: [2025] }, now);
    expect(result.excluded).toBe(true);
    expect(result.exclusionReason).toBe("Ineligible graduation year");
    expect(result.total).toBe(0);
  });

  it("hard-excludes pure SWE roles", () => {
    const result = scoreOpportunity({ ...base, isSwe: true }, now);
    expect(result.excluded).toBe(true);
    expect(result.exclusionReason).toBe("Pure software engineering role");
  });

  it("hard-excludes pure finance roles", () => {
    const result = scoreOpportunity({ ...base, isFinance: true }, now);
    expect(result.excluded).toBe(true);
    expect(result.exclusionReason).toBe("Pure finance role");
  });

  it("hard-excludes closed roles", () => {
    const result = scoreOpportunity({ ...base, active: false }, now);
    expect(result.excluded).toBe(true);
    expect(result.exclusionReason).toBe("Closed role");
  });

  it("gives a lower role-family score outside the target families", () => {
    const result = scoreOpportunity({ ...base, roleFamily: "other" }, now);
    expect(result.roleFamily).toBe(5);
  });

  it("awards the established-company bonus", () => {
    const result = scoreOpportunity({ ...base, established: true }, now);
    expect(result.establishedCompany).toBe(10);
  });

  it("scores deadline urgency by days remaining", () => {
    expect(
      scoreOpportunity({ ...base, deadline: "2026-07-15T00:00:00Z" }, now)
        .deadlineUrgency,
    ).toBe(10);
    expect(
      scoreOpportunity({ ...base, deadline: "2026-07-25T00:00:00Z" }, now)
        .deadlineUrgency,
    ).toBe(8);
    expect(
      scoreOpportunity({ ...base, deadline: "2026-08-05T00:00:00Z" }, now)
        .deadlineUrgency,
    ).toBe(5);
    expect(
      scoreOpportunity({ ...base, deadline: "2026-09-01T00:00:00Z" }, now)
        .deadlineUrgency,
    ).toBe(3);
    expect(
      scoreOpportunity({ ...base, deadline: "2027-01-01T00:00:00Z" }, now)
        .deadlineUrgency,
    ).toBe(1);
    expect(
      scoreOpportunity({ ...base, deadline: "2026-07-01T00:00:00Z" }, now)
        .deadlineUrgency,
    ).toBe(1);
  });

  it("respects manual overrides for the person-judged dimensions", () => {
    const result = scoreOpportunity(
      {
        ...base,
        skillsExperienceOverride: 18,
        interestIndustryOverride: 9,
        userFeedbackOverride: 5,
      },
      now,
    );
    expect(result.skillsExperience).toBe(18);
    expect(result.interestIndustry).toBe(9);
    expect(result.userFeedback).toBe(5);
  });
});
