import { describe, expect, it } from "vitest";
import { getLocalDayRange } from "./date-range";
import {
  buildFreeIntervals,
  clipToCapacity,
  deadlineUrgency,
  energyMismatch,
  goalImportance,
  placeTasks,
  priorityScore,
  reserveBufferBlock,
  rolloverPressure,
  scoreTask,
  shortTaskBonus,
  totalMinutes,
  type PlacementCandidate,
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

  it("reflects the true 23-hour span on a US spring-forward day", () => {
    const dayRange = getLocalDayRange(
      new Date("2026-03-08T18:00:00Z"),
      "America/Los_Angeles",
    );
    const free = buildFreeIntervals(dayRange, [], 0);
    expect(totalMinutes(free)).toBeCloseTo(23 * 60 * 0.75, 5);
  });

  it("reflects the true 25-hour span on a US fall-back day", () => {
    const dayRange = getLocalDayRange(
      new Date("2026-11-01T18:00:00Z"),
      "America/Los_Angeles",
    );
    const free = buildFreeIntervals(dayRange, [], 0);
    expect(totalMinutes(free)).toBeCloseTo(25 * 60 * 0.75, 5);
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

function candidate(
  id: string,
  overrides: Partial<PlacementCandidate>,
): PlacementCandidate {
  return {
    id,
    ...task({}),
    ...overrides,
  };
}

describe("clipToCapacity", () => {
  const intervals = [
    {
      start: new Date("2026-07-11T09:00:00Z"),
      end: new Date("2026-07-11T10:00:00Z"),
    },
    {
      start: new Date("2026-07-11T13:00:00Z"),
      end: new Date("2026-07-11T15:00:00Z"),
    },
  ];

  it("passes intervals through unchanged when capacity is null", () => {
    expect(clipToCapacity(intervals, null)).toEqual(intervals);
  });

  it("keeps whole intervals until capacity runs out, then trims the last one", () => {
    const clipped = clipToCapacity(intervals, 90);
    expect(clipped).toHaveLength(2);
    expect(clipped[0]).toEqual(intervals[0]);
    expect(clipped[1].end.toISOString()).toBe("2026-07-11T13:30:00.000Z");
  });

  it("drops later intervals once capacity is exhausted", () => {
    const clipped = clipToCapacity(intervals, 60);
    expect(clipped).toEqual([intervals[0]]);
  });
});

describe("reserveBufferBlock", () => {
  it("swallows a single interval no bigger than the buffer itself", () => {
    const intervals = [
      {
        start: new Date("2026-07-11T09:00:00Z"),
        end: new Date("2026-07-11T09:20:00Z"),
      },
    ];
    expect(reserveBufferBlock(intervals, 30)).toEqual([]);
  });

  it("trims the tail of a single larger interval", () => {
    const intervals = [
      {
        start: new Date("2026-07-11T09:00:00Z"),
        end: new Date("2026-07-11T10:00:00Z"),
      },
    ];
    const [reserved] = reserveBufferBlock(intervals, 30);
    expect(reserved.end.toISOString()).toBe("2026-07-11T09:30:00.000Z");
  });

  it("removes the largest of several intervals, keeping the rest untouched", () => {
    const small = {
      start: new Date("2026-07-11T09:00:00Z"),
      end: new Date("2026-07-11T09:30:00Z"),
    };
    const large = {
      start: new Date("2026-07-11T13:00:00Z"),
      end: new Date("2026-07-11T17:00:00Z"),
    };
    const result = reserveBufferBlock([small, large], 30);
    expect(result).toEqual([small]);
  });
});

describe("placeTasks", () => {
  const context = { now: new Date("2026-07-11T08:00:00Z"), userEnergy: null };

  it("places the higher-scored task first, high-energy earliest and low-energy latest", () => {
    const freeIntervals = [
      {
        start: new Date("2026-07-11T09:00:00Z"),
        end: new Date("2026-07-11T12:00:00Z"),
      },
    ];
    const high = candidate("high", {
      priority: "high",
      energy: "high",
      estimated_minutes: 60,
    });
    const low = candidate("low", {
      priority: "low",
      energy: "low",
      estimated_minutes: 60,
    });

    const placed = placeTasks([high, low], freeIntervals, context);

    expect(placed.map((b) => b.taskId)).toEqual(["high", "low"]);
    expect(placed[0].start.toISOString()).toBe("2026-07-11T09:00:00.000Z");
    expect(placed[1].end.toISOString()).toBe("2026-07-11T11:30:00.000Z");
  });

  it("leaves a task unplaced when it doesn't fit any remaining interval", () => {
    const freeIntervals = [
      {
        start: new Date("2026-07-11T09:00:00Z"),
        end: new Date("2026-07-11T10:00:00Z"),
      },
    ];
    const tooLong = candidate("too-long", { estimated_minutes: 45 });
    const fits = candidate("fits", { estimated_minutes: 20 });

    const placed = placeTasks([tooLong, fits], freeIntervals, context);

    expect(placed.map((b) => b.taskId)).toEqual(["fits"]);
  });

  it("never schedules into the reserved buffer block", () => {
    const freeIntervals = [
      {
        start: new Date("2026-07-11T09:00:00Z"),
        end: new Date("2026-07-11T09:20:00Z"),
      },
    ];
    const anyTask = candidate("t1", { estimated_minutes: 10 });

    expect(placeTasks([anyTask], freeIntervals, context)).toEqual([]);
  });

  it("includes a human-readable explanation for each placed block", () => {
    const freeIntervals = [
      {
        start: new Date("2026-07-11T09:00:00Z"),
        end: new Date("2026-07-11T10:00:00Z"),
      },
    ];
    const urgent = candidate("urgent", {
      due_date: "2026-07-11T07:00:00Z",
      estimated_minutes: 20,
    });

    const [placed] = placeTasks([urgent], freeIntervals, context);
    expect(placed.explanation).toMatch(/due soon/);
  });
});
