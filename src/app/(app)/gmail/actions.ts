"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDraft, getMessage } from "@/lib/gmail/client";
import { getValidGmailAccessToken } from "@/lib/gmail/tokens";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Sticky-confirm mirrors 6.4/6.6's review-queue pattern — this app never auto-acts on an extracted item. */
export async function confirmGmailItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gmail_items")
    .update({ confirmed: true })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/gmail");
  return { ok: true };
}

/** Sticky rejection — a re-sync never resurrects a dismissed item, matching `gmail_processed_messages`' own once-per-message guarantee. */
export async function dismissGmailItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gmail_items")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/gmail");
  return { ok: true };
}

export type DraftGmailReplyInput = {
  subject: string;
  content: string;
};

/**
 * Proposes a reply/follow-up draft (PLAN.md §15 task 7.7). This only ever
 * writes a `gmail_drafts` row here in GYST — nothing reaches the real
 * Gmail account until `pushGmailDraft` (explicit approval step).
 */
export async function draftGmailReply(
  itemId: string,
  input: DraftGmailReplyInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: item, error: fetchError } = await supabase
    .from("gmail_items")
    .select("id, gmail_message_id, gmail_thread_id")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchError || !item) {
    return { ok: false, error: fetchError?.message ?? "Item not found." };
  }

  const { error } = await supabase.from("gmail_drafts").insert({
    user_id: user.id,
    gmail_item_id: item.id,
    gmail_thread_id: item.gmail_thread_id,
    in_reply_to_message_id: item.gmail_message_id,
    subject: input.subject,
    content: input.content,
    status: "proposed",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/gmail");
  return { ok: true };
}

export async function updateGmailDraft(
  draftId: string,
  input: DraftGmailReplyInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gmail_drafts")
    .update({ subject: input.subject, content: input.content })
    .eq("id", draftId)
    .eq("status", "proposed");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/gmail");
  return { ok: true };
}

export async function deleteGmailDraft(draftId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("gmail_drafts").delete().eq("id", draftId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/gmail");
  return { ok: true };
}

/**
 * The explicit-approval step (PLAN.md's "must never send messages... without
 * explicit approval"): creates the draft in the user's real Gmail drafts
 * folder via the API. Still never sends — the user has to open Gmail and
 * click Send themselves. Re-fetches the original message fresh (rather than
 * storing its headers long-term) just to get the `From`/`Message-ID` needed
 * for a correct In-Reply-To — task 7.8's "no full mailbox storage".
 */
export async function pushGmailDraft(draftId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: draft, error: fetchError } = await supabase
    .from("gmail_drafts")
    .select("id, gmail_thread_id, in_reply_to_message_id, subject, content, status")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchError || !draft) {
    return { ok: false, error: fetchError?.message ?? "Draft not found." };
  }
  if (draft.status === "created") {
    return { ok: false, error: "This draft is already in Gmail." };
  }

  try {
    const accessToken = await getValidGmailAccessToken(supabase, user.id);
    if (!accessToken) {
      return { ok: false, error: "Gmail isn't connected." };
    }

    const original = await getMessage(accessToken, draft.in_reply_to_message_id);
    const created = await createDraft(accessToken, {
      threadId: draft.gmail_thread_id,
      inReplyToMessageId: draft.in_reply_to_message_id,
      inReplyToHeaderMessageId: original.messageIdHeader,
      to: original.from,
      subject: draft.subject,
      body: draft.content,
    });

    const { error } = await supabase
      .from("gmail_drafts")
      .update({ status: "created", gmail_draft_id: created.id })
      .eq("id", draftId);
    if (error) return { ok: false, error: error.message };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create draft in Gmail.",
    };
  }

  revalidatePath("/gmail");
  return { ok: true };
}
