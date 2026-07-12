import { describe, expect, it } from "vitest";
import { buildOverwhelmPlan } from "./overwhelm";
import type { Task } from "./tasks";

const now = new Date("2026-07-11T12:00:00Z");

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "id",
    title: overrides.title ?? "Task",
    notes: null,
    area: "general",
    status: "not_started",
    priority: "medium",
    estimated_minutes: null,
    due_date: null,
    rollover_count: 0,
    ...overrides,
  };
}

describe("buildOverwhelmPlan", () => {
  it("picks the highest-scored non-wellness task as urgent", () => {
    const overdue = task({
      id: "overdue",
      title: "Overdue thing",
      due_date: "2026-07-01T00:00:00Z",
      priority: "high",
    });
    const distant = task({
      id: "distant",
      title: "Distant thing",
      due_date: "2026-12-01T00:00:00Z",
      priority: "low",
    });
    const plan = buildOverwhelmPlan([overdue, distant], now, "medium");
    expect(plan.urgent?.id).toBe("overdue");
  });

  it("prefers a short task for life-maintenance and a wellness task for self-care", () => {
    const urgent = task({
      id: "urgent",
      priority: "high",
      due_date: "2026-07-01T00:00:00Z",
    });
    const shortLife = task({ id: "short", estimated_minutes: 10 });
    const longLife = task({ id: "long", estimated_minutes: 120 });
    const wellness = task({ id: "wellness", area: "wellness" });

    const plan = buildOverwhelmPlan(
      [urgent, longLife, shortLife, wellness],
      now,
      "medium",
    );

    expect(plan.urgent?.id).toBe("urgent");
    expect(plan.lifeMaintenance?.id).toBe("short");
    expect(plan.selfCare?.id).toBe("wellness");
  });

  it("puts everything not chosen into the review queue instead of dropping it", () => {
    const tasks = [
      task({ id: "a", priority: "high", due_date: "2026-07-01T00:00:00Z" }),
      task({ id: "b", estimated_minutes: 10 }),
      task({ id: "c", area: "wellness" }),
      task({ id: "d" }),
      task({ id: "e" }),
    ];
    const plan = buildOverwhelmPlan(tasks, now, "medium");
    const chosenIds = [
      plan.urgent?.id,
      plan.lifeMaintenance?.id,
      plan.selfCare?.id,
    ];
    expect(plan.reviewQueue.every((t) => !chosenIds.includes(t.id))).toBe(true);
    expect(plan.reviewQueue.length).toBe(
      tasks.length - chosenIds.filter(Boolean).length,
    );
  });

  it("excludes completed tasks and returns null selfCare when no wellness task exists", () => {
    const completed = task({ id: "done", status: "completed" });
    const open = task({ id: "open" });
    const plan = buildOverwhelmPlan([completed, open], now, "medium");
    expect(plan.reviewQueue.some((t) => t.id === "done")).toBe(false);
    expect(plan.selfCare).toBeNull();
  });

  it("returns a starter step referencing the urgent task's title", () => {
    const urgent = task({ id: "urgent", title: "Email professor" });
    const plan = buildOverwhelmPlan([urgent], now, "low");
    expect(plan.starterStep).toMatch(/Email professor/);
  });

  it("returns a null starter step when there is nothing open", () => {
    const plan = buildOverwhelmPlan([], now, "low");
    expect(plan.starterStep).toBeNull();
  });
});
