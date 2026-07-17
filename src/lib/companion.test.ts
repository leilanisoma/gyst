import { describe, expect, it } from "vitest";
import { deriveCompanionState, type CompanionSignals } from "./companion";

const BASE: CompanionSignals = {
  nowTimeOfDay: "12:00",
  nowIso: "2026-07-16T19:00:00.000Z",
  todaySchedules: [],
  todayEvents: [],
  inProgressTaskAreas: [],
  energy: null,
  recruitingActionDueOrOverdue: false,
};

describe("deriveCompanionState", () => {
  it("returns fencing during an active fencing recurring schedule", () => {
    expect(
      deriveCompanionState({
        ...BASE,
        todaySchedules: [
          {
            title: "Fencing practice",
            category: "fencing",
            start_time: "11:00:00",
            end_time: "13:00:00",
          },
        ],
      }),
    ).toBe("fencing");
  });

  it("returns fencing for a synced event titled like fencing, active now", () => {
    expect(
      deriveCompanionState({
        ...BASE,
        todayEvents: [
          {
            title: "Fencing Practice",
            course_id: null,
            start_at: "2026-07-16T18:00:00.000Z",
            end_at: "2026-07-16T20:00:00.000Z",
          },
        ],
      }),
    ).toBe("fencing");
  });

  it("returns studying during an active class recurring schedule", () => {
    expect(
      deriveCompanionState({
        ...BASE,
        todaySchedules: [
          {
            title: "CS 101",
            category: "class",
            start_time: "11:30:00",
            end_time: "12:30:00",
          },
        ],
      }),
    ).toBe("studying");
  });

  it("returns studying for a Canvas-linked event active now, even without a title match", () => {
    expect(
      deriveCompanionState({
        ...BASE,
        todayEvents: [
          {
            title: "Assignment 3 due",
            course_id: "course-123",
            start_at: "2026-07-16T18:30:00.000Z",
            end_at: "2026-07-16T19:30:00.000Z",
          },
        ],
      }),
    ).toBe("studying");
  });

  it("does not treat an inactive schedule as current", () => {
    expect(
      deriveCompanionState({
        ...BASE,
        todaySchedules: [
          {
            title: "Fencing practice",
            category: "fencing",
            start_time: "14:00:00",
            end_time: "16:00:00",
          },
        ],
      }),
    ).toBe("idle");
  });

  it("prioritizes fencing over an overlapping class schedule", () => {
    expect(
      deriveCompanionState({
        ...BASE,
        todaySchedules: [
          {
            title: "Fencing practice",
            category: "fencing",
            start_time: "11:00:00",
            end_time: "13:00:00",
          },
          {
            title: "CS 101",
            category: "class",
            start_time: "11:00:00",
            end_time: "13:00:00",
          },
        ],
      }),
    ).toBe("fencing");
  });

  it("returns resting when energy is low, with nothing scheduled", () => {
    expect(deriveCompanionState({ ...BASE, energy: "low" })).toBe("resting");
  });

  it("prioritizes an active class over low energy", () => {
    expect(
      deriveCompanionState({
        ...BASE,
        energy: "low",
        todaySchedules: [
          {
            title: "CS 101",
            category: "class",
            start_time: "11:00:00",
            end_time: "13:00:00",
          },
        ],
      }),
    ).toBe("studying");
  });

  it("returns recruiting when a next action is due or overdue", () => {
    expect(
      deriveCompanionState({ ...BASE, recruitingActionDueOrOverdue: true }),
    ).toBe("recruiting");
  });

  it("returns recruiting when a recruiting-area task is in progress", () => {
    expect(
      deriveCompanionState({
        ...BASE,
        inProgressTaskAreas: ["recruiting"],
      }),
    ).toBe("recruiting");
  });

  it("falls back through task areas: school, then wellness, then general", () => {
    expect(
      deriveCompanionState({ ...BASE, inProgressTaskAreas: ["school"] }),
    ).toBe("studying");
    expect(
      deriveCompanionState({ ...BASE, inProgressTaskAreas: ["wellness"] }),
    ).toBe("resting");
    expect(
      deriveCompanionState({ ...BASE, inProgressTaskAreas: ["general"] }),
    ).toBe("focused");
  });

  it("returns idle with no signals at all", () => {
    expect(deriveCompanionState(BASE)).toBe("idle");
  });
});
