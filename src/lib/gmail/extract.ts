import type { createClient } from "@/lib/supabase/server";
import { getGmailAIClient } from "@/ai";
import { GmailExtractionResultSchema } from "@/ai/types";
import { encryptSecret } from "@/lib/crypto";
import type { GmailMessageContent } from "./client";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ExtractGmailItemsResult =
  | { ok: true; itemsCreated: number }
  | { ok: false; error: string };

/**
 * Asks the configured AIClient to identify interview dates, application
 * confirmations, deadlines, and requested actions in one Gmail message
 * (PLAN.md §15 task 7.4). Every item lands `confirmed: false` — same
 * require-confirmation rule as 6.4/6.6's Canvas/syllabus candidates. Uses
 * `getGmailAIClient()` (Groq, falling back to the global Gemini client —
 * docs/DECISIONS/0003-groq-for-gmail-extraction.md) rather than
 * `getAIClient()` directly, so this feature can run on a different provider
 * than chat/inbox/syllabus extraction.
 *
 * Only the AI's own short excerpt is persisted (encrypted) — the message's
 * full body/headers are never written to Supabase (task 7.8, "no full
 * mailbox storage").
 */
export async function extractGmailItemsFromMessage(
  supabase: SupabaseServerClient,
  userId: string,
  message: GmailMessageContent,
  retentionDays: number,
): Promise<ExtractGmailItemsResult> {
  const client = getGmailAIClient();
  if (!client) {
    return {
      ok: false,
      error: "AI extraction isn't available yet — no provider is configured.",
    };
  }

  const messageText = `Subject: ${message.subject}\nFrom: ${message.from}\n\n${message.bodyText}`;
  const raw = await client.extractGmailMessage(messageText);
  const parsed = GmailExtractionResultSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "AI returned an unexpected shape." };
  }
  if (parsed.data.items.length === 0) {
    return { ok: true, itemsCreated: 0 };
  }

  const expiresAt = new Date(
    Date.now() + retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error: insertError } = await supabase.from("gmail_items").insert(
    parsed.data.items.map((item) => ({
      user_id: userId,
      gmail_message_id: message.id,
      gmail_thread_id: message.threadId,
      kind: item.kind,
      title: item.title,
      excerpt_encrypted: item.excerpt ? encryptSecret(item.excerpt) : null,
      date_at: item.date,
      requested_action: item.requestedAction,
      confidence: item.confidence,
      confirmed: false,
      expires_at: expiresAt,
    })),
  );
  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true, itemsCreated: parsed.data.items.length };
}
