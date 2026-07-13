import type { createClient } from "@/lib/supabase/server";
import { listAssignments, listCalendarEvents, listCourses } from "./client";
import { markCanvasError, markCanvasSynced } from "./integration";
import { estimateAssignmentMinutes } from "./estimate";
import { classifyAssessmentCandidate } from "./assessment-candidates";
import { createMilestoneSuggestions } from "@/lib/milestones";
import { isLikelyDuplicateEvent } from "@/lib/dedupe";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type RunCanvasSyncResult =
  | {
      ok: true;
      coursesUpserted: number;
      assignmentsUpserted: number;
      eventsUpserted: number;
      tasksUpserted: number;
      assessmentCandidatesCreated: number;
      milestoneSuggestionsCreated: number;
      eventsDeduped: number;
    }
  | { ok: false; error: string };

function assignmentIsSubmitted(assignment: {
  submission?: { workflow_state: string } | null;
}): boolean {
  const state = assignment.submission?.workflow_state;
  return state === "submitted" || state === "graded" || state === "complete";
}

/**
 * Syncs Canvas courses, assignments, and published calendar events into
 * `courses`/`assignments`/`events`, and logs one `sync_runs` row for the
 * whole pass — the same shape as `runGoogleSync` (Phase 3). Existing rows
 * are matched by (user_id, canvas_*_id) so re-running never duplicates.
 *
 * Also mirrors each non-submitted assignment into `tasks` (area "school",
 * linked via `source_assignment_id`) so it flows into the existing
 * scheduler with no scheduler code changes (PLAN.md §15 task 6.10) — the
 * scheduler already selects every incomplete task regardless of area.
 */
export async function runCanvasSync(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<RunCanvasSyncResult> {
  const { data: syncRun } = await supabase
    .from("sync_runs")
    .insert({ user_id: userId, provider: "canvas", status: "running" })
    .select("id")
    .single();

  try {
    const courses = await listCourses();
    let coursesUpserted = 0;
    let assignmentsUpserted = 0;
    let eventsUpserted = 0;
    let tasksUpserted = 0;
    let assessmentCandidatesCreated = 0;
    let milestoneSuggestionsCreated = 0;
    const courseIdByCanvasId = new Map<number, string>();

    for (const course of courses) {
      const { data: courseRow, error: courseError } = await supabase
        .from("courses")
        .upsert(
          {
            user_id: userId,
            canvas_course_id: String(course.id),
            title: course.name,
            course_code: course.course_code,
            term: course.term?.name ?? null,
            active: true,
          },
          { onConflict: "user_id,canvas_course_id" },
        )
        .select("id")
        .single();
      if (courseError || !courseRow) {
        throw new Error(`Failed to upsert course ${course.id}: ${courseError?.message}`);
      }
      coursesUpserted++;
      courseIdByCanvasId.set(course.id, courseRow.id);

      const assignments = await listAssignments(course.id);
      for (const assignment of assignments) {
        const submitted = assignmentIsSubmitted(assignment);
        const { data: assignmentRow, error: assignmentError } = await supabase
          .from("assignments")
          .upsert(
            {
              user_id: userId,
              course_id: courseRow.id,
              canvas_assignment_id: String(assignment.id),
              title: assignment.name,
              due_at: assignment.due_at,
              points_possible: assignment.points_possible,
              submission_types: assignment.submission_types ?? [],
              submitted,
              submitted_at: assignment.submission?.submitted_at ?? null,
              html_url: assignment.html_url,
            },
            { onConflict: "user_id,canvas_assignment_id" },
          )
          .select("id")
          .single();
        if (assignmentError || !assignmentRow) {
          throw new Error(
            `Failed to upsert assignment ${assignment.id}: ${assignmentError?.message}`,
          );
        }
        assignmentsUpserted++;

        // Task 6.10: mirror into `tasks` so the existing scheduler (which
        // selects every incomplete task regardless of area) picks it up.
        const { data: existingTask } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", userId)
          .eq("source_assignment_id", assignmentRow.id)
          .maybeSingle();

        if (submitted) {
          if (existingTask) {
            await supabase
              .from("tasks")
              .update({ status: "completed" })
              .eq("id", existingTask.id);
          }
          continue;
        }

        const estimatedMinutes = estimateAssignmentMinutes(assignment);
        const { data: taskRow, error: taskError } = await supabase
          .from("tasks")
          .upsert(
            {
              ...(existingTask ? { id: existingTask.id } : {}),
              user_id: userId,
              title: assignment.name,
              area: "school",
              status: "not_started",
              priority: "medium",
              estimated_minutes: estimatedMinutes,
              due_date: assignment.due_at,
              source: "canvas",
              source_assignment_id: assignmentRow.id,
            },
            { onConflict: "id" },
          )
          .select("id")
          .single();
        if (taskError || !taskRow) {
          throw new Error(
            `Failed to upsert task for assignment ${assignment.id}: ${taskError?.message}`,
          );
        }
        tasksUpserted++;

        await supabase.from("work_estimates").upsert(
          {
            user_id: userId,
            task_id: taskRow.id,
            predicted_minutes: estimatedMinutes,
            estimator_version: "v1",
          },
          { onConflict: "task_id" },
        );

        // Task 6.4: flag exam/midterm/final/presentation/project-shaped
        // assignments as candidate assessments needing confirmation. Only
        // created once per assignment — a prior confirm/dismiss decision
        // (`confirmed`/`dismissed_at`) must survive every later re-sync.
        const candidate = classifyAssessmentCandidate(assignment);
        if (candidate) {
          const { data: existingAssessment } = await supabase
            .from("assessments")
            .select("id")
            .eq("user_id", userId)
            .eq("assignment_id", assignmentRow.id)
            .maybeSingle();
          if (!existingAssessment) {
            await supabase.from("assessments").insert({
              user_id: userId,
              course_id: courseRow.id,
              assignment_id: assignmentRow.id,
              kind: candidate.kind,
              title: assignment.name,
              scheduled_at: assignment.due_at,
              source: "canvas",
              confidence: candidate.confidence,
              confirmed: false,
            });
            assessmentCandidatesCreated++;
          }
        }

        // Task 6.7: a "major" assignment (high point value, regardless of
        // whether it's also exam-shaped) gets suggested prep checkpoints.
        if (assignment.due_at) {
          milestoneSuggestionsCreated += await createMilestoneSuggestions(
            supabase,
            userId,
            {
              title: assignment.name,
              dueAt: assignment.due_at,
              pointsPossible: assignment.points_possible,
              assignmentId: assignmentRow.id,
            },
            new Date(),
          );
        }
      }
    }

    const courseIds = [...courseIdByCanvasId.keys()];
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const calendarEvents = await listCalendarEvents(courseIds, startDate, endDate);

    // Task 6.9: a course's own published calendar entry and a manually/
    // Gmail-forwarded Google Calendar entry for the same real-world exam
    // shouldn't both show up on Today — fetched once per sync, not once
    // per event, since it's the same candidate set for every comparison.
    const { data: googleEventRows } = await supabase
      .from("events")
      .select("title, start_at")
      .eq("user_id", userId)
      .eq("source", "google")
      .gte("start_at", new Date(startDate).toISOString())
      .lte("start_at", new Date(endDate).toISOString());
    const googleEvents = (googleEventRows ?? []).map((row) => ({
      title: row.title,
      startAt: new Date(row.start_at),
    }));
    let eventsDeduped = 0;

    for (const event of calendarEvents) {
      if (!event.start_at || !event.end_at) continue;
      const canvasCourseId = Number(event.context_code.replace("course_", ""));
      const courseId = courseIdByCanvasId.get(canvasCourseId) ?? null;

      if (isLikelyDuplicateEvent({ title: event.title, startAt: new Date(event.start_at) }, googleEvents)) {
        eventsDeduped++;
        continue;
      }

      const { error: eventError } = await supabase.from("events").upsert(
        {
          user_id: userId,
          course_id: courseId,
          title: event.title,
          kind: "fixed",
          start_at: event.start_at,
          end_at: event.end_at,
          all_day: false,
          location: event.location_name,
          is_fixed_commitment: true,
          source: "canvas",
          source_id: String(event.id),
        },
        { onConflict: "user_id,source,source_id" },
      );
      if (eventError) {
        throw new Error(`Failed to upsert event ${event.id}: ${eventError.message}`);
      }
      eventsUpserted++;
    }

    await markCanvasSynced(supabase, userId);
    if (syncRun) {
      await supabase
        .from("sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          events_created: eventsUpserted,
        })
        .eq("id", syncRun.id);
    }

    return {
      ok: true,
      coursesUpserted,
      assignmentsUpserted,
      eventsUpserted,
      tasksUpserted,
      assessmentCandidatesCreated,
      milestoneSuggestionsCreated,
      eventsDeduped,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error.";
    await markCanvasError(supabase, userId, message);
    if (syncRun) {
      await supabase
        .from("sync_runs")
        .update({ finished_at: new Date().toISOString(), status: "error", error: message })
        .eq("id", syncRun.id);
    }
    return { ok: false, error: message };
  }
}
