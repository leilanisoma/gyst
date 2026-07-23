import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";
import { getGmailIntegration } from "@/lib/gmail/integration";
import { GMAIL_SCOPES } from "@/lib/gmail/oauth";
import {
  GmailReviewQueue,
  type GmailItemRow,
} from "@/components/gmail/gmail-review-queue";
import {
  GmailDraftsSection,
  type GmailDraftRow,
} from "@/components/gmail/gmail-drafts-section";

/**
 * Gmail's page content, minus the `<main>`/`RoomBackground`/
 * `RoomContentPanel` wrapper — factored out (2026-07-20) so the `/gmail`
 * route and the mailbox popup on the Living Room hub render the exact same
 * thing without duplicating the data-fetching.
 */
export async function GmailContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? "";

  const integration = await getGmailIntegration(supabase, userId);

  if (!integration || integration.status === "not_connected") {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Gmail</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Connect Gmail from{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>{" "}
          to see interview dates, application confirmations, deadlines, and
          requested actions detected from a scoped search or label.
        </p>
      </>
    );
  }

  const { data: itemRows } = await supabase
    .from("gmail_items")
    .select(
      "id, gmail_thread_id, kind, title, excerpt_encrypted, date_at, requested_action, confidence",
    )
    .eq("user_id", userId)
    .eq("confirmed", false)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  const items: GmailItemRow[] = (itemRows ?? []).map((row) => ({
    id: row.id,
    gmail_thread_id: row.gmail_thread_id,
    kind: row.kind as GmailItemRow["kind"],
    title: row.title,
    excerpt: row.excerpt_encrypted
      ? decryptSecret(row.excerpt_encrypted)
      : null,
    date_at: row.date_at,
    requested_action: row.requested_action,
    confidence: row.confidence,
  }));

  const { data: draftRows } = await supabase
    .from("gmail_drafts")
    .select("id, subject, content, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const drafts: GmailDraftRow[] = (draftRows ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    content: row.content,
    status: row.status as GmailDraftRow["status"],
  }));

  const hasComposeScope = integration.granted_scopes.includes(
    GMAIL_SCOPES.compose,
  );

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Gmail</h1>
      <GmailReviewQueue items={items} />
      <GmailDraftsSection drafts={drafts} hasComposeScope={hasComposeScope} />
    </>
  );
}
