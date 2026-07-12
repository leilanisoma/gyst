"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NotificationRules } from "@/lib/notifications";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function subscribeToPush(
  input: PushSubscriptionInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { onConflict: "user_id,endpoint" },
  );
  if (error) {
    return { ok: false, error: error.message };
  }

  await setPushEnabled(supabase, user.id, true);
  revalidatePath("/settings");
  return { ok: true };
}

export async function unsubscribeFromPush(
  endpoint: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (!count) {
    await setPushEnabled(supabase, user.id, false);
  }

  revalidatePath("/settings");
  return { ok: true };
}

async function setPushEnabled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  pushEnabled: boolean,
) {
  const { data: preferences } = await supabase
    .from("preferences")
    .select("notification_rules")
    .eq("id", userId)
    .maybeSingle();
  const rules = (preferences?.notification_rules ?? {}) as NotificationRules;
  await supabase
    .from("preferences")
    .update({ notification_rules: { ...rules, push_enabled: pushEnabled } })
    .eq("id", userId);
}

export type QuietHoursInput = {
  quietHoursStart: string;
  quietHoursEnd: string;
};

export async function updateQuietHours(
  input: QuietHoursInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: preferences } = await supabase
    .from("preferences")
    .select("notification_rules")
    .eq("id", user.id)
    .maybeSingle();
  const rules = (preferences?.notification_rules ?? {}) as NotificationRules;

  const { error } = await supabase
    .from("preferences")
    .update({
      notification_rules: {
        ...rules,
        quiet_hours_start: input.quietHoursStart,
        quiet_hours_end: input.quietHoursEnd,
      },
    })
    .eq("id", user.id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}
