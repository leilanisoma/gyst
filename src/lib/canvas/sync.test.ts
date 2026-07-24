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

  it("calibrates a recurring category's estimate against logged actual time in the same course", async () => {
    reset();
    state.courses = [{ id: 1, name: "CS 101", course_code: "CS101", term: null }];
    state.assignmentsByCourse[1] = [
      {
        id: 100,
        name: "Quiz 1",
        due_at: "2026-08-01T00:00:00Z",
        points_possible: null,
        submission_types: ["online_quiz"],
        html_url: "https://canvas.example.edu/assignments/100",
        submission: null,
      },
    ];

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    await runCanvasSync(db, "user-1");
    expect(db.tables.work_estimates[0]).toMatchObject({
      predicted_minutes: 30,
      estimator_version: "v1",
      category: "quiz",
    });

    // Ishani logs that Quiz 1 actually only took 15 minutes.
    db.tables.work_estimates[0].actual_minutes = 15;

    // Next week's quiz shows up on the next sync.
    state.assignmentsByCourse[1].push({
      id: 101,
      name: "Quiz 2",
      due_at: "2026-08-08T00:00:00Z",
      points_possible: null,
      submission_types: ["online_quiz"],
      html_url: "https://canvas.example.edu/assignments/101",
      submission: null,
    });

    await runCanvasSync(db, "user-1");

    const quiz2Task = db.tables.tasks.find((t: { title: string }) => t.title === "Quiz 2");
    const quiz2Estimate = db.tables.work_estimates.find(
      (e: { task_id: string }) => e.task_id === quiz2Task.id,
    );
    expect(quiz2Task.estimated_minutes).toBe(15);
    expect(quiz2Estimate).toMatchObject({
      predicted_minutes: 15,
      estimator_version: "v2",
      category: "quiz",
    });

    // Quiz 1's own estimate is untouched by the second sync — it was
    // already submitted-status-independent, but re-syncing shouldn't wipe
    // the actual_minutes the user just logged.
    expect(db.tables.work_estimates[0].actual_minutes).toBe(15);
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

  it("creates milestone suggestions for a high-point assignment due far enough out", async () => {
    reset();
    state.courses = [{ id: 1, name: "CS 101", course_code: "CS101", term: null }];
    state.assignmentsByCourse[1] = [
      {
        id: 300,
        name: "Term Paper",
        due_at: "2026-12-01T00:00:00Z",
        points_possible: 100,
        submission_types: ["online_upload"],
        html_url: "https://canvas.example.edu/assignments/300",
        submission: null,
      },
    ];

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    const result = await runCanvasSync(db, "user-1");

    expect(result).toMatchObject({ ok: true, milestoneSuggestionsCreated: 4 });
    expect(db.tables.milestone_suggestions).toHaveLength(4);
    expect(db.tables.milestone_suggestions[0]).toMatchObject({ status: "proposed" });

    const second = await runCanvasSync(db, "user-1");
    expect(second).toMatchObject({ milestoneSuggestionsCreated: 0 });
    expect(db.tables.milestone_suggestions).toHaveLength(4);
  });

  it("creates an unconfirmed assessment candidate for a midterm-shaped assignment, once", async () => {
    reset();
    state.courses = [{ id: 1, name: "CS 101", course_code: "CS101", term: null }];
    state.assignmentsByCourse[1] = [
      {
        id: 200,
        name: "Midterm 1",
        due_at: "2026-08-15T00:00:00Z",
        points_possible: 50,
        submission_types: ["on_paper"],
        html_url: "https://canvas.example.edu/assignments/200",
        submission: null,
      },
    ];

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    const first = await runCanvasSync(db, "user-1");
    expect(first).toMatchObject({ ok: true, assessmentCandidatesCreated: 1 });
    expect(db.tables.assessments).toHaveLength(1);
    expect(db.tables.assessments[0]).toMatchObject({
      kind: "midterm",
      confirmed: false,
      source: "canvas",
      title: "Midterm 1",
    });

    const second = await runCanvasSync(db, "user-1");
    expect(second).toMatchObject({ ok: true, assessmentCandidatesCreated: 0 });
    expect(db.tables.assessments).toHaveLength(1);
  });

  it("does not resurrect a dismissed assessment candidate on the next sync", async () => {
    reset();
    state.courses = [{ id: 1, name: "CS 101", course_code: "CS101", term: null }];
    state.assignmentsByCourse[1] = [
      {
        id: 200,
        name: "Midterm 1",
        due_at: "2026-08-15T00:00:00Z",
        points_possible: 50,
        submission_types: ["on_paper"],
        html_url: "https://canvas.example.edu/assignments/200",
        submission: null,
      },
    ];

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    await runCanvasSync(db, "user-1");
    db.tables.assessments[0].dismissed_at = "2026-07-13T00:00:00Z";

    const second = await runCanvasSync(db, "user-1");
    expect(second).toMatchObject({ ok: true, assessmentCandidatesCreated: 0 });
    expect(db.tables.assessments).toHaveLength(1);
    expect(db.tables.assessments[0].dismissed_at).not.toBeNull();
  });

  it("skips a Canvas calendar event that duplicates an existing Google Calendar event (task 6.9)", async () => {
    reset();
    state.courses = [{ id: 1, name: "CS 101", course_code: "CS101", term: null }];
    const inFiveDays = new Date(new Date().getTime() + 5 * 86_400_000);
    state.events = [
      {
        id: 500,
        title: "Midterm Exam",
        start_at: inFiveDays.toISOString(),
        end_at: new Date(inFiveDays.getTime() + 3_600_000).toISOString(),
        location_name: null,
        context_code: "course_1",
        html_url: "https://canvas.example.edu/calendar",
      },
    ];

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    db.tables.events = [
      {
        id: "existing-google-event",
        user_id: "user-1",
        title: "CS101 Midterm Exam",
        source: "google",
        start_at: inFiveDays.toISOString(),
      },
    ];

    const result = await runCanvasSync(db, "user-1");
    expect(result).toMatchObject({ ok: true, eventsUpserted: 0, eventsDeduped: 1 });
    expect(db.tables.events).toHaveLength(1);
  });

  it("still creates a Canvas calendar event with no matching Google event", async () => {
    reset();
    state.courses = [{ id: 1, name: "CS 101", course_code: "CS101", term: null }];
    const inFiveDays = new Date(new Date().getTime() + 5 * 86_400_000);
    state.events = [
      {
        id: 500,
        title: "Guest Lecture",
        start_at: inFiveDays.toISOString(),
        end_at: new Date(inFiveDays.getTime() + 3_600_000).toISOString(),
        location_name: "Room 100",
        context_code: "course_1",
        html_url: "https://canvas.example.edu/calendar",
      },
    ];

    const { runCanvasSync } = await import("./sync");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = new FakeSupabase() as any;
    const result = await runCanvasSync(db, "user-1");
    expect(result).toMatchObject({ ok: true, eventsUpserted: 1, eventsDeduped: 0 });
    expect(db.tables.events[0]).toMatchObject({ title: "Guest Lecture", source: "canvas" });
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
