import { describe, expect, it } from "vitest";
import { getLocalDayRange, getLocalDayRanges } from "./date-range";

describe("getLocalDayRange", () => {
  it("returns UTC midnight bounds for a UTC timezone", () => {
    const reference = new Date("2026-07-11T15:00:00Z");
    const { start, end } = getLocalDayRange(reference, "UTC");
    expect(start.toISOString()).toBe("2026-07-11T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-12T00:00:00.000Z");
  });

  it("shifts bounds for a negative-offset timezone", () => {
    // 15:00 UTC is 08:00 in Los Angeles (UTC-7 during PDT), same local day.
    const reference = new Date("2026-07-11T15:00:00Z");
    const { start, end } = getLocalDayRange(reference, "America/Los_Angeles");
    expect(start.toISOString()).toBe("2026-07-11T07:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-12T07:00:00.000Z");
  });

  it("rolls to the previous local day when UTC time is early morning", () => {
    // 03:00 UTC is 20:00 the prior day in Los Angeles.
    const reference = new Date("2026-07-11T03:00:00Z");
    const { start, end } = getLocalDayRange(reference, "America/Los_Angeles");
    expect(start.toISOString()).toBe("2026-07-10T07:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-11T07:00:00.000Z");
  });

  it("handles a positive-offset timezone", () => {
    const reference = new Date("2026-07-11T20:00:00Z");
    const { start, end } = getLocalDayRange(reference, "Asia/Tokyo");
    // Tokyo is UTC+9 with no DST; 20:00 UTC is 05:00 the next local day.
    expect(start.toISOString()).toBe("2026-07-11T15:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-12T15:00:00.000Z");
  });
});

describe("getLocalDayRanges", () => {
  it("returns consecutive, non-overlapping days", () => {
    const reference = new Date("2026-07-11T15:00:00Z");
    const ranges = getLocalDayRanges(reference, "UTC", 7);
    expect(ranges).toHaveLength(7);
    ranges.forEach((range, i) => {
      if (i > 0) {
        expect(range.start.toISOString()).toBe(ranges[i - 1].end.toISOString());
      }
    });
    expect(ranges[0].start.toISOString()).toBe("2026-07-11T00:00:00.000Z");
    expect(ranges[6].end.toISOString()).toBe("2026-07-18T00:00:00.000Z");
  });
});
