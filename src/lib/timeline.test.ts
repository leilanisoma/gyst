import { describe, expect, it } from "vitest";
import { buildDailyTimeline } from "./timeline";

describe("buildDailyTimeline", () => {
  it("merges Google events and recurring schedules sorted by start time", () => {
    const now = new Date("2026-03-09T18:00:00Z");
    const timeline = buildDailyTimeline(
      [
        {
          id: "evt1",
          title: "Dentist",
          start_at: "2026-03-09T20:00:00.000Z",
          end_at: "2026-03-09T21:00:00.000Z",
          all_day: false,
          location: null,
        },
      ],
      [
        {
          id: "sched1",
          title: "Fencing practice",
          start_time: "09:00",
          end_time: "11:00",
          location: "Gym",
        },
      ],
      now,
      "UTC",
    );

    expect(timeline).toHaveLength(2);
    expect(timeline[0].title).toBe("Fencing practice");
    expect(timeline[0].source).toBe("recurring");
    expect(timeline[1].title).toBe("Dentist");
    expect(timeline[1].source).toBe("google");
  });

  it("returns an empty timeline when there's nothing scheduled", () => {
    expect(buildDailyTimeline([], [], new Date(), "UTC")).toEqual([]);
  });
});
