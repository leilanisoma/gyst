import { describe, expect, it } from "vitest";
import { bucketTodayTasks, bucketWeekTasks } from "./today";
import type { Task } from "./tasks";

const reference = new Date("2026-07-11T15:00:00Z"); // Saturday, midday UTC
const timeZone = "UTC";

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "id",
    title: overrides.title ?? "Task",
    notes: null,
    area: "general",
    status: overrides.status ?? "not_started",
    priority: "medium",
    estimated_minutes: null,
    due_date: overrides.due_date ?? null,
    ...overrides,
  };
}

describe("bucketTodayTasks", () => {
  it("separates overdue from due-today and ignores completed/undated tasks", () => {
    const tasks = [
      task({ id: "1", due_date: "2026-07-10T12:00:00Z" }), // overdue
      task({ id: "2", due_date: "2026-07-11T18:00:00Z" }), // due today
      task({ id: "3", due_date: "2026-07-12T01:00:00Z" }), // due tomorrow
      task({ id: "4", due_date: "2026-07-01T00:00:00Z", status: "completed" }),
      task({ id: "5", due_date: null }),
    ];

    const { overdue, dueToday } = bucketTodayTasks(tasks, reference, timeZone);
    expect(overdue.map((t) => t.id)).toEqual(["1"]);
    expect(dueToday.map((t) => t.id)).toEqual(["2"]);
  });
});

describe("bucketWeekTasks", () => {
  it("groups open dated tasks into their local day and excludes past/completed/undated", () => {
    const tasks = [
      task({ id: "1", due_date: "2026-07-11T18:00:00Z" }), // day 0
      task({ id: "2", due_date: "2026-07-13T01:00:00Z" }), // day 2
      task({ id: "3", due_date: "2026-07-20T00:00:00Z" }), // beyond window
      task({ id: "4", due_date: "2026-07-11T20:00:00Z", status: "completed" }),
      task({ id: "5", due_date: null }),
    ];

    const days = bucketWeekTasks(tasks, reference, timeZone, 7);
    expect(days).toHaveLength(7);
    expect(days[0].tasks.map((t) => t.id)).toEqual(["1"]);
    expect(days[1].tasks).toEqual([]);
    expect(days[2].tasks.map((t) => t.id)).toEqual(["2"]);
    expect(days.every((d) => !d.tasks.some((t) => t.id === "3"))).toBe(true);
  });
});
