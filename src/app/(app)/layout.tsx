import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";
import { AppShell } from "@/components/nav/app-shell";
import {
  deriveCompanionState,
  type CompanionEvent,
  type CompanionSchedule,
} from "@/lib/companion";
import {
  getLocalDateString,
  getLocalDayOfWeek,
  getLocalDayRange,
  getLocalTimeOfDay,
} from "@/lib/date-range";
import type { CheckIn } from "@/lib/check-ins";

/** Stages that no longer represent live recruiting momentum. */
const INACTIVE_APPLICATION_STAGES = new Set([
  "discovered",
  "offer",
  "rejected",
  "withdrawn",
  "archived",
]);

/**
 * Companion state is computed here, not on the Today page, so the
 * persistent chat launcher (Phase 9D) reflects real activity signals on
 * every page — not just Today, where it originated (Phase 9C).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? "";

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const timeZone = profile?.timezone ?? "UTC";

  const now = new Date();
  const todayString = getLocalDateString(now, timeZone);
  const todayRange = getLocalDayRange(now, timeZone);

  const { data: checkIn } = await supabase
    .from("check_ins")
    .select("energy")
    .eq("check_in_date", todayString)
    .maybeSingle();

  const { data: todayEvents } = await supabase
    .from("events")
    .select("id, title, start_at, end_at, all_day, location, course_id")
    .is("deleted_at", null)
    .lt("start_at", todayRange.end.toISOString())
    .gt("end_at", todayRange.start.toISOString())
    .order("start_at", { ascending: true });

  const { data: todaySchedules } = await supabase
    .from("recurring_schedules")
    .select("id, title, category, start_time, end_time, location")
    .eq("day_of_week", getLocalDayOfWeek(now, timeZone))
    .eq("active", true);

  const { data: dueApplications } = await supabase
    .from("applications")
    .select("id, stage")
    .lte("next_action_date", todayString);

  const { data: inProgressTasks } = await supabase
    .from("tasks")
    .select("area")
    .eq("status", "in_progress");

  const companionState = deriveCompanionState({
    nowTimeOfDay: getLocalTimeOfDay(now, timeZone),
    nowIso: now.toISOString(),
    todaySchedules: (todaySchedules ?? []) as CompanionSchedule[],
    todayEvents: (todayEvents ?? []) as CompanionEvent[],
    inProgressTaskAreas: [
      ...new Set((inProgressTasks ?? []).map((task) => task.area)),
    ],
    energy: (checkIn as Pick<CheckIn, "energy"> | null)?.energy ?? null,
    recruitingActionDueOrOverdue: (dueApplications ?? []).some(
      (application) => !INACTIVE_APPLICATION_STAGES.has(application.stage),
    ),
  });

  return (
    <AppShell
      email={data.user?.email}
      notifications={notifications ?? []}
      chatAvailable={Boolean(getAIClient())}
      companionState={companionState}
    >
      {children}
    </AppShell>
  );
}
