import type { createClient } from "@/lib/supabase/server";
import type { SupabaseServiceClient } from "@/lib/supabase/service";
import { isWithinQuietHours } from "./quiet-hours";
import { sendPush } from "./webpush";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AnySupabaseClient = SupabaseServerClient | SupabaseServiceClient;

export type NotificationKind =
  "info" | "sync_error" | "deadline" | "block_reminder" | "digest";

export type NotificationRules = {
  push_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
};

export type CreateNotificationInput = {
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
};

/**
 * Records an in-app notification and, if the user has push enabled and it's
 * outside quiet hours, best-effort pushes it to every registered device.
 * Never throws on the push leg — a failed/expired push subscription must
 * not block the notification itself from being recorded.
 */
export async function createNotification(
  supabase: AnySupabaseClient,
  userId: string,
  input: CreateNotificationInput,
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: userId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  });

  await pushIfAllowed(supabase, userId, input);
}

async function pushIfAllowed(
  supabase: AnySupabaseClient,
  userId: string,
  input: CreateNotificationInput,
) {
  const { data: preferences } = await supabase
    .from("preferences")
    .select("notification_rules")
    .eq("id", userId)
    .maybeSingle();
  const rules = (preferences?.notification_rules ?? {}) as NotificationRules;
  if (!rules.push_enabled) return;

  if (rules.quiet_hours_start && rules.quiet_hours_end) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    const quiet = isWithinQuietHours(
      new Date(),
      profile?.timezone ?? "UTC",
      rules.quiet_hours_start,
      rules.quiet_hours_end,
    );
    if (quiet) return;
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  for (const subscription of subscriptions ?? []) {
    const result = await sendPush(subscription, {
      title: input.title,
      body: input.body,
      link: input.link,
    });
    if (result.gone) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("id", subscription.id);
    }
  }
}
