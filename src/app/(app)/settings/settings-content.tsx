import { createClient } from "@/lib/supabase/server";
import { InstallInstructions } from "@/components/pwa/install-instructions";
import { GoogleIntegrationCard } from "@/components/settings/google-integration-card";
import { GmailIntegrationCard } from "@/components/settings/gmail-integration-card";
import { NotificationSettingsCard } from "@/components/settings/notification-settings-card";
import { TimezoneSelect } from "@/components/settings/timezone-select";
import { RecurringScheduleForm } from "@/components/settings/recurring-schedule-form";
import { RecurringScheduleList } from "@/components/settings/recurring-schedule-list";
import { listCalendars } from "@/lib/google/calendar";
import { getGoogleIntegration } from "@/lib/google/integration";
import { GOOGLE_SCOPES } from "@/lib/google/oauth";
import { getValidGoogleAccessToken } from "@/lib/google/tokens";
import {
  DEFAULT_GMAIL_RETENTION_DAYS,
  getGmailIntegration,
} from "@/lib/gmail/integration";
import { GMAIL_SCOPES } from "@/lib/gmail/oauth";
import {
  getDailyChatTokenLimit,
  getTodayFeatureTokenUsage,
} from "@/lib/chat/usage";
import type { NotificationRules } from "@/lib/notifications";
import type { RecurringSchedule } from "@/lib/recurring-schedules";

/**
 * Settings' page content, minus the `<main>`/`RoomBackground`/
 * `RoomContentPanel` wrapper — factored out (2026-07-20) so the
 * `/settings` route and the thermostat popup on the Living Room hub render
 * the exact same thing without duplicating the data-fetching.
 */
export async function SettingsContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? "";

  const integration = await getGoogleIntegration(supabase, userId);
  const gmailIntegration = await getGmailIntegration(supabase, userId);
  let calendars: { id: string; summary: string }[] = [];
  if (integration?.status !== "not_connected" && integration) {
    try {
      const accessToken = await getValidGoogleAccessToken(supabase, userId);
      if (accessToken) {
        calendars = (await listCalendars(accessToken)).map((cal) => ({
          id: cal.id,
          summary: cal.summary,
        }));
      }
    } catch {
      // Sync status/errors surface from the integration row itself; the
      // calendar picker just stays empty if this best-effort fetch fails
      // (including a revoked refresh token, which would otherwise crash
      // this Server Component's render).
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

  const todayChatTokens = await getTodayFeatureTokenUsage(
    supabase,
    userId,
    "chat",
  );
  const dailyChatTokenLimit = getDailyChatTokenLimit();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <dl className="grid gap-2 text-base">
        <div className="border-border flex justify-between border-b py-2">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{profile?.email ?? data.user?.email}</dd>
        </div>
        <div className="border-border flex items-center justify-between border-b py-2">
          <dt className="text-muted-foreground">Timezone</dt>
          <dd>
            <TimezoneSelect timezone={profile?.timezone ?? "UTC"} />
          </dd>
        </div>
      </dl>
      <p className="text-muted-foreground text-base">
        Working hours and AI limits arrive with `preferences` in a later
        phase.
      </p>

      <div className="flex flex-col gap-3 border-t pt-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <NotificationSettingsCard
          quietHoursStart={notificationRules.quiet_hours_start ?? "22:00"}
          quietHoursEnd={notificationRules.quiet_hours_end ?? "07:00"}
          pushSubscribed={Boolean(pushSubscriptionCount)}
        />
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <h2 className="text-lg font-semibold">Google Calendar</h2>
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

      <div className="flex flex-col gap-3 border-t pt-4">
        <h2 className="text-lg font-semibold">Gmail</h2>
        <GmailIntegrationCard
          status={gmailIntegration?.status ?? "not_connected"}
          accountEmail={gmailIntegration?.account_email ?? null}
          lastSyncedAt={gmailIntegration?.last_synced_at ?? null}
          error={gmailIntegration?.error ?? null}
          hasComposeScope={
            gmailIntegration?.granted_scopes.includes(GMAIL_SCOPES.compose) ??
            false
          }
          initialSearchQuery={gmailIntegration?.settings.search_query ?? ""}
          initialRetentionDays={
            gmailIntegration?.settings.retention_days ??
            DEFAULT_GMAIL_RETENTION_DAYS
          }
        />
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Class &amp; fencing schedule
          </h2>
        </div>
        <p className="text-muted-foreground text-base">
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

      <div className="flex flex-col gap-2 border-t pt-4">
        <h2 className="text-lg font-semibold">AI usage</h2>
        <p className="text-muted-foreground text-base">
          Chat tokens used today: {todayChatTokens.toLocaleString()} /{" "}
          {dailyChatTokenLimit.toLocaleString()}
        </p>
      </div>

      <InstallInstructions />
    </>
  );
}
