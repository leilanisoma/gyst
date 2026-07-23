import type { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { getMessage, listMessageIds } from "./client";
import { extractGmailItemsFromMessage } from "./extract";
import {
  DEFAULT_GMAIL_RETENTION_DAYS,
  DEFAULT_GMAIL_SEARCH_QUERY,
  getGmailIntegration,
  markGmailError,
  markGmailSynced,
} from "./integration";
import { getValidGmailAccessToken } from "./tokens";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type RunGmailSyncResult =
  | { ok: true; messagesScanned: number; itemsCreated: number }
  | { ok: false; error: string };

/**
 * Scans messages matching the Gmail search query — the user's own
 * `search_query` if they've set one, otherwise `DEFAULT_GMAIL_SEARCH_QUERY`
 * (the whole mailbox minus Promotions/Social/Spam/Trash) — extracts
 * candidates from each message not already processed, and logs one
 * `sync_runs` row for the pass. `gmail_processed_messages` means a message
 * is only ever fetched/extracted once, regardless of how many times sync
 * re-runs.
 */
export async function runGmailSync(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<RunGmailSyncResult> {
  let accessToken: string | null;
  try {
    accessToken = await getValidGmailAccessToken(supabase, userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown token refresh error.";
    await markGmailError(supabase, userId, message);
    return { ok: false, error: message };
  }
  if (!accessToken) {
    return { ok: false, error: "Gmail isn't connected." };
  }

  const integration = await getGmailIntegration(supabase, userId);
  const query = integration?.settings.search_query?.trim() || DEFAULT_GMAIL_SEARCH_QUERY;
  const retentionDays =
    integration?.settings.retention_days ?? DEFAULT_GMAIL_RETENTION_DAYS;

  const { data: syncRun } = await supabase
    .from("sync_runs")
    .insert({ user_id: userId, provider: "gmail", status: "running" })
    .select("id")
    .single();

  try {
    const refs = await listMessageIds(accessToken, query);

    let messagesScanned = 0;
    let itemsCreated = 0;

    for (const ref of refs) {
      const { data: seen } = await supabase
        .from("gmail_processed_messages")
        .select("id")
        .eq("user_id", userId)
        .eq("gmail_message_id", ref.id)
        .maybeSingle();
      if (seen) continue;

      messagesScanned++;
      const message = await getMessage(accessToken, ref.id);
      const result = await extractGmailItemsFromMessage(
        supabase,
        userId,
        message,
        retentionDays,
      );
      if (result.ok) itemsCreated += result.itemsCreated;

      await supabase.from("gmail_processed_messages").insert({
        user_id: userId,
        gmail_message_id: ref.id,
      });
    }

    await markGmailSynced(supabase, userId);

    if (itemsCreated > 0) {
      await createNotification(supabase, userId, {
        kind: "info",
        title: `${itemsCreated} new item${itemsCreated === 1 ? "" : "s"} from Gmail need review`,
        link: "/gmail",
      });
    }

    if (syncRun) {
      await supabase
        .from("sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          events_created: itemsCreated,
        })
        .eq("id", syncRun.id);
    }

    return { ok: true, messagesScanned, itemsCreated };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Gmail sync error.";
    await markGmailError(supabase, userId, message);
    if (syncRun) {
      await supabase
        .from("sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "error",
          error: message,
        })
        .eq("id", syncRun.id);
    }
    return { ok: false, error: message };
  }
}
