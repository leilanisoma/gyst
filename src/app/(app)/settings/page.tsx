import { createClient } from "@/lib/supabase/server";
import { InstallInstructions } from "@/components/pwa/install-instructions";
import { GoogleIntegrationCard } from "@/components/settings/google-integration-card";
import { NotificationSettingsCard } from "@/components/settings/notification-settings-card";
import { RecurringScheduleForm } from "@/components/settings/recurring-schedule-form";
import { RecurringScheduleList } from "@/components/settings/recurring-schedule-list";
import { listCalendars } from "@/lib/google/calendar";
import { getGoogleIntegration } from "@/lib/google/integration";
import { GOOGLE_SCOPES } from "@/lib/google/oauth";
import { getValidGoogleAccessToken } from "@/lib/google/tokens";
import type { NotificationRules } from "@/lib/notifications";
import type { RecurringSchedule } from "@/lib/recurring-schedules";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? "";

  const integration = await getGoogleIntegration(supabase, userId);
  let calendars: { id: string; summary: string }[] = [];
  if (integration?.status !== "not_connected" && integration) {
    const accessToken = await getValidGoogleAccessToken(supabase, userId);
    if (accessToken) {
      try {
        calendars = (await listCalendars(accessToken)).map((cal) => ({
          id: cal.id,
          summary: cal.summary,
        }));
      } catch {
        // Sync status/errors surface from the integration row itself; the
        // calendar picker just stays empty if this best-effort fetch fails.
      }
    }
  }

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

  const { data: preferences } = await supabase
    .from("preferences")
    .select("notification_rules")
    .eq("id", userId)
    .maybeSingle();
  const notificationRules = (preferences?.notification_rules ??
    {}) as NotificationRules;

  const { count: pushSubscriptionCount } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

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
        Working hours and AI limits arrive with `preferences` in a later phase.
      </p>

      <div className="flex max-w-sm flex-col gap-3 border-t pt-4">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <NotificationSettingsCard
          quietHoursStart={notificationRules.quiet_hours_start ?? "22:00"}
          quietHoursEnd={notificationRules.quiet_hours_end ?? "07:00"}
          pushSubscribed={Boolean(pushSubscriptionCount)}
        />
      </div>

      <div className="flex max-w-sm flex-col gap-3 border-t pt-4">
        <h2 className="text-sm font-semibold">Google Calendar</h2>
        <GoogleIntegrationCard
          status={integration?.status ?? "not_connected"}
          accountEmail={integration?.account_email ?? null}
          lastSyncedAt={integration?.last_synced_at ?? null}
          error={integration?.error ?? null}
          calendars={calendars}
          initialFixedCalendarIds={
            integration?.settings.fixed_calendar_ids ?? []
          }
          hasWriteScope={
            integration?.granted_scopes.includes(
              GOOGLE_SCOPES.calendarAppCreated,
            ) ?? false
          }
        />
      </div>

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
