import { describe, expect, it } from "vitest";
import {
  groupSchedulesByDay,
  sortSchedules,
  type RecurringSchedule,
} from "./recurring-schedules";

function schedule(overrides: Partial<RecurringSchedule>): RecurringSchedule {
  return {
    id: overrides.id ?? "id",
    title: overrides.title ?? "Class",
    category: overrides.category ?? "class",
    day_of_week: overrides.day_of_week ?? 1,
    start_time: overrides.start_time ?? "09:00:00",
    end_time: overrides.end_time ?? "10:00:00",
    location: overrides.location ?? null,
    active: overrides.active ?? true,
  };
}

describe("sortSchedules", () => {
  it("orders by day of week, then start time", () => {
    const schedules = [
      schedule({ id: "b", day_of_week: 1, start_time: "14:00:00" }),
      schedule({ id: "a", day_of_week: 1, start_time: "09:00:00" }),
      schedule({ id: "c", day_of_week: 0, start_time: "23:00:00" }),
    ];
    expect(sortSchedules(schedules).map((s) => s.id)).toEqual(["c", "a", "b"]);
  });
});

describe("groupSchedulesByDay", () => {
  it("returns all 7 days, including empty ones, in Sunday-first order", () => {
    const schedules = [
      schedule({ id: "mon", day_of_week: 1 }),
      schedule({ id: "fri", day_of_week: 5 }),
    ];
    const days = groupSchedulesByDay(schedules);
    expect(days).toHaveLength(7);
    expect(days[0].label).toBe("Sunday");
    expect(days[1].schedules.map((s) => s.id)).toEqual(["mon"]);
    expect(days[5].schedules.map((s) => s.id)).toEqual(["fri"]);
    expect(days[2].schedules).toEqual([]);
  });
});
