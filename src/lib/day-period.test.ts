import { describe, expect, it } from "vitest";
import { dayPeriodFromHour } from "./day-period";

describe("dayPeriodFromHour", () => {
  it("buckets early morning hours as night", () => {
    expect(dayPeriodFromHour(0)).toBe("night");
    expect(dayPeriodFromHour(4)).toBe("night");
  });

  it("buckets sunrise hours as dawn", () => {
    expect(dayPeriodFromHour(5)).toBe("dawn");
    expect(dayPeriodFromHour(7)).toBe("dawn");
  });

  it("buckets daytime hours as day", () => {
    expect(dayPeriodFromHour(8)).toBe("day");
    expect(dayPeriodFromHour(16)).toBe("day");
  });

  it("buckets evening hours as dusk", () => {
    expect(dayPeriodFromHour(17)).toBe("dusk");
    expect(dayPeriodFromHour(19)).toBe("dusk");
  });

  it("buckets late evening hours as night", () => {
    expect(dayPeriodFromHour(20)).toBe("night");
    expect(dayPeriodFromHour(23)).toBe("night");
  });
});
