import { createClient } from "@/lib/supabase/server";
import { InstallInstructions } from "@/components/pwa/install-instructions";
import { RecurringScheduleForm } from "@/components/settings/recurring-schedule-form";
import { RecurringScheduleList } from "@/components/settings/recurring-schedule-list";
import type { RecurringSchedule } from "@/lib/recurring-schedules";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, timezone")
    .eq("id", data.user?.id ?? "")
    .maybeSingle();

  const { data: schedules } = await supabase
    .from("recurring_schedules")
    .select(
      "id, title, category, day_of_week, start_time, end_time, location, active",
    )
    .eq("active", true);

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <dl className="grid max-w-sm gap-2 text-sm">
        <div className="border-border flex justify-between border-b py-2">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{profile?.email ?? data.user?.email}</dd>
        </div>
        <div className="border-border flex justify-between border-b py-2">
          <dt className="text-muted-foreground">Timezone</dt>
          <dd>{profile?.timezone ?? "UTC"}</dd>
        </div>
      </dl>
      <p className="text-muted-foreground max-w-sm text-sm">
        Working hours, notification rules, and AI limits arrive with
        `preferences` in a later phase.
      </p>

      <div className="flex max-w-sm flex-col gap-3 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Class &amp; fencing schedule
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Fixed weekly commitments the day plan should protect. Add your real
          schedule whenever you have it — the planner just needs it before it
          can suggest time blocks.
        </p>
        <div className="flex gap-2">
          <RecurringScheduleForm category="class" triggerLabel="Add class" />
          <RecurringScheduleForm
            category="fencing"
            triggerLabel="Add fencing session"
          />
        </div>
        <RecurringScheduleList
          schedules={(schedules ?? []) as RecurringSchedule[]}
        />
      </div>

      <InstallInstructions />
    </main>
  );
}
