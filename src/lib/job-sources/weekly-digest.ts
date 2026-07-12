import type { createClient } from "@/lib/supabase/server";
import type { SupabaseServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AnySupabaseClient = SupabaseServerClient | SupabaseServiceClient;

const TERMINAL_STAGES = ["rejected", "withdrawn", "archived", "discovered"];
const CLOSING_SOON_DAYS = 14;

export type WeeklyDigestSummary = {
  newDiscoveries: number;
  closingSoon: number;
  followUpsDue: number;
};

/** Counts the same three things the Recruiting page already surfaces (discovery queue, closing soon, follow-ups due) — the digest is a reminder to look, not a second source of truth. */
export async function buildWeeklyDigestSummary(
  supabase: AnySupabaseClient,
  userId: string,
): Promise<WeeklyDigestSummary> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const closingCutoff = new Date(now.getTime() + CLOSING_SOON_DAYS * 86_400_000).toISOString();

  const { count: newDiscoveries } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("stage", "discovered");

  const { count: closingSoon } = await supabase
    .from("applications")
    .select("id, opportunity:opportunities!inner(deadline, active)", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("stage", "in", `(${TERMINAL_STAGES.join(",")})`)
    .eq("opportunity.active", true)
    .gte("opportunity.deadline", today)
    .lte("opportunity.deadline", closingCutoff);

  const { count: followUpsDue } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("stage", "in", `(${TERMINAL_STAGES.join(",")})`)
    .lte("next_action_date", now.toISOString());

  return {
    newDiscoveries: newDiscoveries ?? 0,
    closingSoon: closingSoon ?? 0,
    followUpsDue: followUpsDue ?? 0,
  };
}

export function formatWeeklyDigestBody(summary: WeeklyDigestSummary): string | null {
  const parts: string[] = [];
  if (summary.newDiscoveries > 0) {
    parts.push(`${summary.newDiscoveries} new opportunit${summary.newDiscoveries === 1 ? "y" : "ies"} to triage`);
  }
  if (summary.closingSoon > 0) {
    parts.push(`${summary.closingSoon} closing within ${CLOSING_SOON_DAYS} days`);
  }
  if (summary.followUpsDue > 0) {
    parts.push(`${summary.followUpsDue} follow-up${summary.followUpsDue === 1 ? "" : "s"} due`);
  }
  if (parts.length === 0) return null;
  return parts.join(", ") + ".";
}

/** Sends the weekly recruiting digest if there's anything worth mentioning — an empty week doesn't get a notification, matching the "no guilt copy, no noise" UX principle. */
export async function sendWeeklyDigest(
  supabase: AnySupabaseClient,
  userId: string,
): Promise<{ sent: boolean; summary: WeeklyDigestSummary }> {
  const summary = await buildWeeklyDigestSummary(supabase, userId);
  const body = formatWeeklyDigestBody(summary);
  if (!body) {
    return { sent: false, summary };
  }

  await createNotification(supabase, userId, {
    kind: "digest",
    title: "Recruiting digest",
    body,
    link: "/recruiting",
  });
  return { sent: true, summary };
}
