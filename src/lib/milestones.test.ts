import { describe, expect, it } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import { createMilestoneSuggestions, generateMilestoneDates, isMilestoneWorthy } from "./milestones";

describe("isMilestoneWorthy", () => {
  it("flags a high-point assignment", () => {
    expect(isMilestoneWorthy({ pointsPossible: 100 })).toBe(true);
  });

  it("does not flag a small assignment with no assessment kind", () => {
    expect(isMilestoneWorthy({ pointsPossible: 10 })).toBe(false);
  });

  it("flags a final/midterm/project/presentation regardless of points", () => {
    expect(isMilestoneWorthy({ assessmentKind: "final", pointsPossible: 5 })).toBe(true);
    expect(isMilestoneWorthy({ assessmentKind: "midterm" })).toBe(true);
    expect(isMilestoneWorthy({ assessmentKind: "project" })).toBe(true);
    expect(isMilestoneWorthy({ assessmentKind: "presentation" })).toBe(true);
  });

  it("does not flag a quiz just because it's an assessment kind", () => {
    expect(isMilestoneWorthy({ assessmentKind: "quiz", pointsPossible: 5 })).toBe(false);
  });
});

describe("generateMilestoneDates", () => {
  it("returns all four offsets when the due date is far enough out", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const dueAt = new Date("2026-02-01T00:00:00Z"); // 31 days out
    const dates = generateMilestoneDates(dueAt, now);
    expect(dates.map((d) => d.label)).toEqual(["Start", "Outline / first draft", "Revise", "Final review"]);
  });

  it("drops offsets that would fall before now", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const dueAt = new Date("2026-01-05T00:00:00Z"); // 4 days out — "Start" (14d) and "Outline" (7d) would fall before now
    const dates = generateMilestoneDates(dueAt, now);
    expect(dates.map((d) => d.label)).toEqual(["Revise", "Final review"]);
  });

  it("returns nothing when even the closest offset has passed", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const dueAt = new Date("2026-01-01T12:00:00Z"); // due today
    expect(generateMilestoneDates(dueAt, now)).toEqual([]);
  });
});

describe("createMilestoneSuggestions", () => {
  it("creates one suggestion per surviving offset for a major assignment", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    const now = new Date("2026-01-01T00:00:00Z");
    const created = await createMilestoneSuggestions(
      db,
      "user-1",
      { title: "Term Paper", dueAt: "2026-02-01T00:00:00Z", pointsPossible: 100, assignmentId: "assignment-1" },
      now,
    );
    expect(created).toBe(4);
    expect(db.tables.milestone_suggestions).toHaveLength(4);
    expect(db.tables.milestone_suggestions[0]).toMatchObject({
      assignment_id: "assignment-1",
      status: "proposed",
      title: "Start: Term Paper",
    });
  });

  it("does not create suggestions for a non-major assignment", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    const created = await createMilestoneSuggestions(
      db,
      "user-1",
      { title: "Reading Response", dueAt: "2026-02-01T00:00:00Z", pointsPossible: 5, assignmentId: "assignment-1" },
      new Date("2026-01-01T00:00:00Z"),
    );
    expect(created).toBe(0);
    expect(db.tables.milestone_suggestions ?? []).toHaveLength(0);
  });

  it("does not duplicate suggestions on a second call for the same assignment", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    const now = new Date("2026-01-01T00:00:00Z");
    const input = { title: "Term Paper", dueAt: "2026-02-01T00:00:00Z", pointsPossible: 100, assignmentId: "assignment-1" };
    await createMilestoneSuggestions(db, "user-1", input, now);
    const second = await createMilestoneSuggestions(db, "user-1", input, now);
    expect(second).toBe(0);
    expect(db.tables.milestone_suggestions).toHaveLength(4);
  });
});
