import { createClient } from "@/lib/supabase/server";
import { RoomHeader } from "@/components/room/room-header";
import { RoomBackground } from "@/components/room/room-background";
import { RoomContentPanel } from "@/components/room/room-content-panel";
import { CollapsibleSection } from "@/components/room/collapsible-section";
import { RoomSideTabs } from "@/components/room/room-side-tabs";
import { GrowthPlant } from "@/components/room/growth-plant";
import { ROOMS } from "@/lib/rooms";
import { isCanvasConfigured } from "@/lib/env";
import { getCanvasIntegration } from "@/lib/canvas/integration";
import { schoolGrowthStage, schoolTaskCompletionRate } from "@/lib/school-growth";
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
import { TaskBoard } from "@/components/tasks/task-board";
import type { Task } from "@/lib/tasks";
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

  const { data: schoolTaskRows } = await supabase
    .from("tasks")
    .select(
      "id, title, notes, area, status, priority, estimated_minutes, due_date, rollover_count, course_id, course:courses(title), work_estimates(predicted_minutes, actual_minutes)",
    )
    .eq("area", "school")
    .order("created_at", { ascending: true });

  const schoolTasks: Task[] = (schoolTaskRows ?? []).map((row) => {
    const estimate = row.work_estimates[0] ?? null;
    return {
      ...row,
      course_title: (row.course as { title: string } | null)?.title ?? null,
      predicted_minutes: estimate?.predicted_minutes ?? null,
      actual_minutes: estimate?.actual_minutes ?? null,
    };
  }) as Task[];

  const courseOptions = (courses ?? []).map((c) => ({
    id: c.id,
    title: c.title,
  }));
  const completionRate = schoolTaskCompletionRate(schoolTasks);
  const growthStage = schoolGrowthStage(completionRate);

  return (
    <main className="relative isolate h-screen overflow-hidden">
      <RoomBackground room={ROOMS.school.background} />

      <div
        className="absolute top-[60%] left-[47%] z-10 hidden md:block"
        style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.35))" }}
      >
        <GrowthPlant
          stage={growthStage}
          brightness={0.75 + completionRate * 0.4}
          ariaLabel={`Growing steadily — ${Math.round(completionRate * 100)}% of school tasks completed`}
          title={`${Math.round(completionRate * 100)}% of school tasks completed`}
          size={3.2}
          pot
          leafColor="var(--chart-1)"
        />
      </div>

      <RoomContentPanel className="absolute inset-x-4 top-16 max-h-[40vh] md:inset-x-auto md:top-1/2 md:left-[4%] md:max-h-[80vh] md:w-[400px] md:-translate-y-1/2">
        <RoomHeader {...ROOMS.school} />
        <p className="text-muted-foreground text-sm">
          Canvas courses, deadlines, and study planning.
        </p>

        <AssessmentReviewQueue candidates={candidates} />
        <MilestoneSuggestionsQueue suggestions={milestoneSuggestions} />
        <SyllabusItemsReviewQueue items={syllabusItems} />
      </RoomContentPanel>

      {/* Desktop: a persistent tab rail that expands leftward, one tab open at a time, closes on click-away. */}
      <div className="absolute top-1/2 right-[4%] z-10 hidden -translate-y-1/2 md:flex">
        <RoomSideTabs
          tabs={[
            {
              id: "tasks",
              label: "Tasks",
              width: "w-[min(720px,80vw)]",
              content: (
                <TaskBoard
                  tasks={schoolTasks}
                  area="school"
                  courses={courseOptions}
                  instanceId="school-tasks-desktop"
                />
              ),
            },
            {
              id: "canvas",
              label: "Canvas sync",
              content: (
                <CanvasSyncCard
                  configured={configured}
                  status={integration?.status ?? "not_connected"}
                  lastSyncedAt={integration?.last_synced_at ?? null}
                  error={integration?.error ?? null}
                />
              ),
            },
            {
              id: "courses",
              label: "Courses",
              content: <CoursesSection courses={courses ?? []} />,
            },
            {
              id: "syllabus",
              label: "Syllabus",
              content: (
                <SyllabusSection
                  courses={courseOptions}
                />
              ),
            },
            {
              id: "assessments",
              label: "Upcoming assessments",
              content: <UpcomingAssessments assessments={upcomingAssessments} />,
            },
          ]}
        />
      </div>

      {/* Mobile fallback: the tab-rail's expand-left/click-away doesn't translate below md, so this stays the plain stacked-accordion layout. */}
      <RoomContentPanel className="absolute inset-x-4 bottom-4 max-h-[40vh] md:hidden">
        <h2 className="font-heading text-base font-semibold">More</h2>
        <CollapsibleSection title="Tasks">
          <TaskBoard
            tasks={schoolTasks}
            area="school"
            courses={courseOptions}
            instanceId="school-tasks-mobile"
          />
        </CollapsibleSection>
        <CollapsibleSection title="Canvas sync">
          <CanvasSyncCard
            configured={configured}
            status={integration?.status ?? "not_connected"}
            lastSyncedAt={integration?.last_synced_at ?? null}
            error={integration?.error ?? null}
          />
        </CollapsibleSection>
        <CollapsibleSection title="Courses">
          <CoursesSection courses={courses ?? []} />
        </CollapsibleSection>
        <CollapsibleSection title="Syllabus">
          <SyllabusSection
            courses={courseOptions}
          />
        </CollapsibleSection>
        <CollapsibleSection title="Upcoming assessments">
          <UpcomingAssessments assessments={upcomingAssessments} />
        </CollapsibleSection>
      </RoomContentPanel>
    </main>
  );
}
