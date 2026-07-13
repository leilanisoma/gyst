import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { CanvasAssignment, CanvasCalendarEvent, CanvasCourse } from "./types";

const state: {
  courses: CanvasCourse[];
  assignmentsByCourse: Record<number, CanvasAssignment[]>;
  events: CanvasCalendarEvent[];
} = { courses: [], assignmentsByCourse: {}, events: [] };

vi.mock("./client", () => ({
  listCourses: vi.fn(async () => state.courses),
  listAssignments: vi.fn(async (courseId: number) => state.assignmentsByCourse[courseId] ?? []),
  listCalendarEvents: vi.fn(async () => state.events),
}));

function reset() {
  state.courses = [];
  state.assignmentsByCourse = {};
  state.events = [];
}

describe("runCanvasSync", () => {
  it("upserts courses, assignments, and a mirrored task for each open assignment", async () => {
    reset();
    state.courses = [{ id: 1, name: "CS 101", course_code: "CS101", term: { name: "Fall 2026" } }];
    state.assignmentsByCourse[1] = [
      {
        id: 100,
        name: "Problem Set 1",
        due_at: "2026-08-01T00:00:00Z",
        points_possible: 20,
        submission_types: ["online_upload"],
        html_url: "https://canvas.example.edu/assignments/100",
        submission: null,
      },
    ];

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    const result = await runCanvasSync(db, "user-1");

    expect(result).toMatchObject({
      ok: true,
      coursesUpserted: 1,
      assignmentsUpserted: 1,
      tasksUpserted: 1,
    });
    expect(db.tables.courses).toHaveLength(1);
    expect(db.tables.assignments[0]).toMatchObject({ title: "Problem Set 1", submitted: false });
    expect(db.tables.tasks[0]).toMatchObject({
      title: "Problem Set 1",
      area: "school",
      source: "canvas",
      estimated_minutes: 200,
    });
    expect(db.tables.work_estimates[0]).toMatchObject({ predicted_minutes: 200, estimator_version: "v1" });
    expect(db.tables.integrations[0]).toMatchObject({ provider: "canvas", status: "connected" });
    expect(db.tables.sync_runs[0]).toMatchObject({ status: "success" });
  });

  it("marks the mirrored task completed once Canvas reports the assignment submitted, without recreating it", async () => {
    reset();
    state.courses = [{ id: 1, name: "CS 101", course_code: "CS101", term: null }];
    state.assignmentsByCourse[1] = [
      {
        id: 100,
        name: "Problem Set 1",
        due_at: "2026-08-01T00:00:00Z",
        points_possible: 20,
        submission_types: ["online_upload"],
        html_url: "https://canvas.example.edu/assignments/100",
        submission: null,
      },
    ];

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    await runCanvasSync(db, "user-1");
    expect(db.tables.tasks).toHaveLength(1);

    state.assignmentsByCourse[1][0].submission = { submitted_at: "2026-07-20T00:00:00Z", workflow_state: "submitted" };
    const second = await runCanvasSync(db, "user-1");

    expect(second).toMatchObject({ ok: true, tasksUpserted: 0 });
    expect(db.tables.tasks).toHaveLength(1);
    expect(db.tables.tasks[0].status).toBe("completed");
  });

  it("records an error run and marks the integration errored when a Canvas call fails", async () => {
    reset();
    const { listCourses } = await import("./client");
    vi.mocked(listCourses).mockRejectedValueOnce(new Error("Canvas returned 500"));

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    const result = await runCanvasSync(db, "user-1");

    expect(result).toEqual({ ok: false, error: "Canvas returned 500" });
    expect(db.tables.integrations[0]).toMatchObject({ status: "error", error: "Canvas returned 500" });
    expect(db.tables.sync_runs[0]).toMatchObject({ status: "error" });
    expect(db.tables.notifications[0]).toMatchObject({ kind: "sync_error" });
  });
});
