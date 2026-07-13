import { createClient } from "@/lib/supabase/server";
import { isCanvasConfigured } from "@/lib/env";
import { getCanvasIntegration } from "@/lib/canvas/integration";
import { CanvasSyncCard } from "@/components/school/canvas-sync-card";
import { CoursesSection } from "@/components/school/courses-section";
import {
  AssessmentReviewQueue,
  type AssessmentCandidateRow,
} from "@/components/school/assessment-review-queue";
import type { AssessmentKind } from "@/lib/assessments";

export default async function SchoolPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const configured = isCanvasConfigured();
  const integration = user ? await getCanvasIntegration(supabase, user.id) : null;

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, course_code, term, assignments(id, title, due_at, submitted, html_url)")
    .eq("active", true)
    .order("title");

  const { data: candidateRows } = await supabase
    .from("assessments")
    .select("id, title, kind, scheduled_at, confidence, source, course:courses(title)")
    .eq("confirmed", false)
    .is("dismissed_at", null)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  const candidates: AssessmentCandidateRow[] = (candidateRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind as AssessmentKind,
    scheduled_at: row.scheduled_at,
    confidence: row.confidence,
    source: row.source,
    courseTitle: (row.course as { title: string } | null)?.title ?? "Unknown course",
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">School</h1>
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
      <CoursesSection courses={courses ?? []} />
    </main>
  );
}
