import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RoomHeader } from "@/components/room/room-header";
import { ROOMS } from "@/lib/rooms";
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

export default async function GmailPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? "";

  const integration = await getGmailIntegration(supabase, userId);

  if (!integration || integration.status === "not_connected") {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <RoomHeader
          {...ROOMS.gmail}
          icon={
            <ROOMS.gmail.icon className="size-6 text-white" aria-hidden="true" />
          }
        />
        <p className="text-muted-foreground max-w-md text-sm">
          Connect Gmail from{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>{" "}
          to see interview dates, application confirmations, deadlines, and
          requested actions detected from a scoped search or label.
        </p>
      </main>
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
    excerpt: row.excerpt_encrypted ? decryptSecret(row.excerpt_encrypted) : null,
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

  const hasComposeScope = integration.granted_scopes.includes(GMAIL_SCOPES.compose);
  const hasSearchQuery = Boolean(integration.settings.search_query?.trim());

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <RoomHeader
        {...ROOMS.gmail}
        icon={
          <ROOMS.gmail.icon className="size-6 text-white" aria-hidden="true" />
        }
      />
      {!hasSearchQuery && (
        <p className="text-muted-foreground max-w-md text-sm">
          Set a Gmail search query or label in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>{" "}
          before syncing — GYST never scans the whole inbox.
        </p>
      )}
      <GmailReviewQueue items={items} />
      <GmailDraftsSection drafts={drafts} hasComposeScope={hasComposeScope} />
    </main>
  );
}
