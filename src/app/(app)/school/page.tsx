import { createClient } from "@/lib/supabase/server";
import { RoomHeader } from "@/components/room/room-header";
import { RoomBackground } from "@/components/room/room-background";
import { RoomContentPanel } from "@/components/room/room-content-panel";
import { ROOMS } from "@/lib/rooms";
import { isCanvasConfigured } from "@/lib/env";
import { getCanvasIntegration } from "@/lib/canvas/integration";
import { CanvasSyncCard } from "@/components/school/canvas-sync-card";
import { CoursesSection } from "@/components/school/courses-section";
import {
  AssessmentReviewQueue,
  type AssessmentCandidateRow,
} from "@/components/school/assessment-review-queue";
import {
  UpcomingAssessments,
  type UpcomingAssessmentRow,
} from "@/components/school/upcoming-assessments";
import { SyllabusSection } from "@/components/school/syllabus-section";
import {
  SyllabusItemsReviewQueue,
  type SyllabusItemRow,
} from "@/components/school/syllabus-items-review-queue";
import {
  MilestoneSuggestionsQueue,
  type MilestoneSuggestionRow,
} from "@/components/school/milestone-suggestions-queue";
import {
  ActualTimeLog,
  type ActualTimeLogRow,
} from "@/components/school/actual-time-log";
import type {
  AssessmentKind,
  AssessmentPreparationStatus,
} from "@/lib/assessments";

export default async function SchoolPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const configured = isCanvasConfigured();
  const integration = user
    ? await getCanvasIntegration(supabase, user.id)
    : null;

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, title, course_code, term, assignments(id, title, due_at, submitted, html_url)",
    )
    .eq("active", true)
    .order("title");

  const { data: candidateRows } = await supabase
    .from("assessments")
    .select(
      "id, title, kind, scheduled_at, confidence, source, course:courses(title)",
    )
    .eq("confirmed", false)
    .is("dismissed_at", null)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  const candidates: AssessmentCandidateRow[] = (candidateRows ?? []).map(
    (row) => ({
      id: row.id,
      title: row.title,
      kind: row.kind as AssessmentKind,
      scheduled_at: row.scheduled_at,
      confidence: row.confidence,
      source: row.source,
      courseTitle:
        (row.course as { title: string } | null)?.title ?? "Unknown course",
    }),
  );

  const { data: upcomingRows } = await supabase
    .from("assessments")
    .select(
      "id, title, kind, scheduled_at, preparation_status, course:courses(title, term)",
    )
    .eq("confirmed", true)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  const upcomingAssessments: UpcomingAssessmentRow[] = (upcomingRows ?? []).map(
    (row) => ({
      id: row.id,
      title: row.title,
      kind: row.kind as AssessmentKind,
      scheduled_at: row.scheduled_at,
      preparation_status: row.preparation_status as AssessmentPreparationStatus,
      courseTitle:
        (row.course as { title: string; term: string | null } | null)?.title ??
        "Unknown course",
      term:
        (row.course as { title: string; term: string | null } | null)?.term ??
        null,
    }),
  );

  const { data: syllabusItemRows } = await supabase
    .from("syllabus_items")
    .select(
      "id, title, description, kind, date, source_page, confidence, course:courses(title)",
    )
    .eq("confirmed", false)
    .order("date", { ascending: true, nullsFirst: false });

  const syllabusItems: SyllabusItemRow[] = (syllabusItemRows ?? []).map(
    (row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      kind: row.kind as SyllabusItemRow["kind"],
      date: row.date,
      sourcePage: row.source_page,
      confidence: row.confidence,
      courseTitle:
        (row.course as { title: string } | null)?.title ?? "Unknown course",
    }),
  );

  const { data: milestoneSuggestionRows } = await supabase
    .from("milestone_suggestions")
    .select("id, title, due_date")
    .eq("status", "proposed")
    .order("due_date", { ascending: true });

  const milestoneSuggestions: MilestoneSuggestionRow[] =
    milestoneSuggestionRows ?? [];

  const { data: completedSchoolTasks } = await supabase
    .from("tasks")
    .select("id, title, work_estimates(predicted_minutes, actual_minutes)")
    .eq("area", "school")
    .eq("status", "completed");

  const actualTimeLogRows: ActualTimeLogRow[] = (completedSchoolTasks ?? [])
    .map((task) => ({
      id: task.id,
      title: task.title,
      estimate: task.work_estimates[0] ?? null,
    }))
    .filter((task) => task.estimate && task.estimate.actual_minutes == null)
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      predictedMinutes: task.estimate?.predicted_minutes ?? null,
    }));

  return (
    <main className="relative isolate flex h-screen flex-col items-center justify-center p-4">
      <RoomBackground room={ROOMS.school.background} />
      <RoomContentPanel>
        <div className="flex flex-col gap-2">
          <RoomHeader {...ROOMS.school} />
          <p className="text-muted-foreground text-sm">
            Canvas courses, deadlines, and study planning.
          </p>
        </div>
        <CanvasSyncCard
          configured={configured}
          status={integration?.status ?? "not_connected"}
          lastSyncedAt={integration?.last_synced_at ?? null}
          error={integration?.error ?? null}
        />
        <AssessmentReviewQueue candidates={candidates} />
        <MilestoneSuggestionsQueue suggestions={milestoneSuggestions} />
        <UpcomingAssessments assessments={upcomingAssessments} />
        <CoursesSection courses={courses ?? []} />
        <SyllabusSection
          courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title }))}
        />
        <SyllabusItemsReviewQueue items={syllabusItems} />
        <ActualTimeLog rows={actualTimeLogRows} />
      </RoomContentPanel>
    </main>
  );
}
