import { describe, expect, it } from "vitest";
import { isWithinQuietHours } from "./quiet-hours";

describe("isWithinQuietHours", () => {
  it("is quiet inside a same-day window", () => {
    const noon = new Date("2026-03-09T12:00:00Z");
    expect(isWithinQuietHours(noon, "UTC", "09:00", "17:00")).toBe(true);
    expect(
      isWithinQuietHours(
        new Date("2026-03-09T08:00:00Z"),
        "UTC",
        "09:00",
        "17:00",
      ),
    ).toBe(false);
  });

  it("handles an overnight window wrapping past midnight", () => {
    expect(
      isWithinQuietHours(
        new Date("2026-03-09T23:30:00Z"),
        "UTC",
        "22:00",
        "07:00",
      ),
    ).toBe(true);
    expect(
      isWithinQuietHours(
        new Date("2026-03-09T03:00:00Z"),
        "UTC",
        "22:00",
        "07:00",
      ),
    ).toBe(true);
    expect(
      isWithinQuietHours(
        new Date("2026-03-09T12:00:00Z"),
        "UTC",
        "22:00",
        "07:00",
      ),
    ).toBe(false);
  });

  it("is never quiet when start equals end (disabled)", () => {
    expect(
      isWithinQuietHours(
        new Date("2026-03-09T23:30:00Z"),
        "UTC",
        "00:00",
        "00:00",
      ),
    ).toBe(false);
  });

  it("respects the timezone, not just UTC wall-clock", () => {
    // 23:00 America/Los_Angeles is 07:00 UTC the next day (PST, UTC-8).
    const lateNightPacific = new Date("2026-03-09T07:00:00Z");
    expect(
      isWithinQuietHours(
        lateNightPacific,
        "America/Los_Angeles",
        "22:00",
        "07:00",
      ),
    ).toBe(true);
    expect(isWithinQuietHours(lateNightPacific, "UTC", "22:00", "07:00")).toBe(
      false,
    );
  });
});
