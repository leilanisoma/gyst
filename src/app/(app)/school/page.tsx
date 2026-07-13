import { createClient } from "@/lib/supabase/server";
import { isCanvasConfigured } from "@/lib/env";
import { getCanvasIntegration } from "@/lib/canvas/integration";
import { CanvasSyncCard } from "@/components/school/canvas-sync-card";
import { CoursesSection } from "@/components/school/courses-section";

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
      <CoursesSection courses={courses ?? []} />
    </main>
  );
}
