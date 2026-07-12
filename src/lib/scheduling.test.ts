import { describe, expect, it } from "vitest";
import {
  buildFreeIntervals,
  deadlineUrgency,
  energyMismatch,
  goalImportance,
  priorityScore,
  rolloverPressure,
  scoreTask,
  shortTaskBonus,
  totalMinutes,
  type ScorableTask,
} from "./scheduling";

const DAY = {
  start: new Date("2026-07-11T00:00:00Z"),
  end: new Date("2026-07-12T00:00:00Z"),
};

function task(overrides: Partial<ScorableTask>): ScorableTask {
  return {
    due_date: null,
    priority: "medium",
    goal_id: null,
    estimated_minutes: null,
    energy: null,
    rollover_count: 0,
    ...overrides,
  };
}

describe("buildFreeIntervals", () => {
  it("returns the whole day reduced by the safety factor when nothing is fixed", () => {
    const free = buildFreeIntervals(DAY, [], 0);
    expect(free).toHaveLength(1);
    expect(totalMinutes(free)).toBeCloseTo(24 * 60 * 0.75, 5);
    expect(free[0].start.toISOString()).toBe(DAY.start.toISOString());
  });

  it("removes a fixed commitment plus buffer on both sides", () => {
    const commitment = {
      start: new Date("2026-07-11T10:00:00Z"),
      end: new Date("2026-07-11T11:00:00Z"),
    };
    const free = buildFreeIntervals(DAY, [commitment], 15, 0);
    expect(free).toHaveLength(2);
    expect(free[0].end.toISOString()).toBe("2026-07-11T09:45:00.000Z");
    expect(free[1].start.toISOString()).toBe("2026-07-11T11:15:00.000Z");
  });

  it("merges overlapping and buffer-adjacent commitments", () => {
    const commitments = [
      {
        start: new Date("2026-07-11T09:00:00Z"),
        end: new Date("2026-07-11T10:00:00Z"),
      },
      {
        start: new Date("2026-07-11T10:10:00Z"),
        end: new Date("2026-07-11T11:00:00Z"),
      },
    ];
    // 15-minute buffer bridges the 10-minute gap between the two commitments.
    const free = buildFreeIntervals(DAY, commitments, 15, 0);
    const middleGap = free.find(
      (interval) =>
        interval.start.getTime() > commitments[0].start.getTime() &&
        interval.end.getTime() < commitments[1].end.getTime(),
    );
    expect(middleGap).toBeUndefined();
  });

  it("drops slivers shorter than the minimum block length", () => {
    const commitments = [
      {
        start: new Date("2026-07-11T09:00:00Z"),
        end: new Date("2026-07-11T10:00:00Z"),
      },
      {
        start: new Date("2026-07-11T10:10:00Z"),
        end: new Date("2026-07-11T11:00:00Z"),
      },
    ];
    const free = buildFreeIntervals(DAY, commitments, 0, 0);
    const gap = free.find(
      (interval) => interval.start.getTime() === commitments[0].end.getTime(),
    );
    expect(gap).toBeUndefined();
  });

  it("returns no free time on a fully booked, zero-capacity day", () => {
    const free = buildFreeIntervals(
      DAY,
      [{ start: DAY.start, end: DAY.end }],
      0,
    );
    expect(free).toEqual([]);
  });
});

describe("scoreTask components", () => {
  it("deadlineUrgency maxes out once overdue instead of growing unbounded", () => {
    const now = new Date("2026-07-11T12:00:00Z");
    const overdue = deadlineUrgency(
      task({ due_date: "2026-06-01T00:00:00Z" }),
      now,
    );
    const justOverdue = deadlineUrgency(
      task({ due_date: "2026-07-11T11:00:00Z" }),
      now,
    );
    expect(overdue).toBe(justOverdue);
  });

  it("priorityScore ranks high above medium above low", () => {
    expect(priorityScore(task({ priority: "high" }))).toBeGreaterThan(
      priorityScore(task({ priority: "medium" })),
    );
    expect(priorityScore(task({ priority: "medium" }))).toBeGreaterThan(
      priorityScore(task({ priority: "low" })),
    );
  });

  it("goalImportance rewards goal-linked tasks", () => {
    expect(goalImportance(task({ goal_id: "g1" }))).toBeGreaterThan(
      goalImportance(task({ goal_id: null })),
    );
  });

  it("shortTaskBonus applies only to short tasks", () => {
    expect(shortTaskBonus(task({ estimated_minutes: 15 }))).toBeGreaterThan(0);
    expect(shortTaskBonus(task({ estimated_minutes: 90 }))).toBe(0);
  });

  it("rolloverPressure is capped", () => {
    expect(rolloverPressure(task({ rollover_count: 3 }))).toBe(3);
    expect(rolloverPressure(task({ rollover_count: 50 }))).toBe(5);
  });

  it("energyMismatch penalizes a low-energy task assigned against high user energy", () => {
    expect(energyMismatch(task({ energy: "low" }), "high")).toBeGreaterThan(
      energyMismatch(task({ energy: "high" }), "high"),
    );
  });
});

describe("scoreTask", () => {
  it("ranks an overdue, high-priority, goal-linked task above a distant low-priority one", () => {
    const now = new Date("2026-07-11T12:00:00Z");
    const urgent = task({
      due_date: "2026-07-01T00:00:00Z",
      priority: "high",
      goal_id: "g1",
    });
    const distant = task({
      due_date: "2026-12-01T00:00:00Z",
      priority: "low",
    });
    const context: { now: Date; userEnergy: null } = { now, userEnergy: null };
    expect(scoreTask(urgent, context)).toBeGreaterThan(
      scoreTask(distant, context),
    );
  });
});
