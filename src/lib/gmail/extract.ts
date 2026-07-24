import type { createClient } from "@/lib/supabase/server";
import { getAIClient, getGmailAIClient } from "@/ai";
import type { AIClient } from "@/ai/client";
import { GmailExtractionResultSchema, type GmailExtractionResult } from "@/ai/types";
import { GroqApiError } from "@/ai/providers/groq";
import { encryptSecret } from "@/lib/crypto";
import type { GmailMessageContent } from "./client";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ExtractGmailItemsResult =
  | { ok: true; itemsCreated: number }
  | { ok: false; error: string };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown AI extraction error.";
}

/** Groq returns 413/429 when a single message's body is too large for the org's tokens-per-minute cap — not a real content problem, just a Groq-specific ceiling. */
function isGroqCapacityError(error: unknown): boolean {
  return error instanceof GroqApiError && (error.status === 413 || error.status === 429);
}

/**
 * Runs extraction on `client`; if `client` is Groq and it rejects the
 * message for being too large/rate-limited, retries once on the global
 * Gemini client with the exact same, full, untruncated `messageText` —
 * Gemini's context window comfortably fits even a very long quoted-thread
 * email, so nothing about the message is ever cut down. Returns an `{ok:
 * false}` result rather than throwing if extraction can't be completed
 * either way, so one oversized/failing message never aborts the rest of a
 * sync run (`src/lib/gmail/sync.ts` loops over many messages per call).
 */
async function runExtraction(
  client: AIClient,
  messageText: string,
): Promise<{ ok: true; data: GmailExtractionResult } | { ok: false; error: string }> {
  try {
    const data = await client.extractGmailMessage(messageText);
    return { ok: true, data };
  } catch (error) {
    if (client.provider === "groq" && isGroqCapacityError(error)) {
      const fallback = getAIClient();
      if (fallback) {
        try {
          const data = await fallback.extractGmailMessage(messageText);
          return { ok: true, data };
        } catch (fallbackError) {
          return { ok: false, error: toErrorMessage(fallbackError) };
        }
      }
    }
    return { ok: false, error: toErrorMessage(error) };
  }
}

/**
 * Asks the configured AIClient to identify interview dates, application
 * confirmations, deadlines, and requested actions in one Gmail message
 * (PLAN.md §15 task 7.4). Every item lands `confirmed: false` — same
 * require-confirmation rule as 6.4/6.6's Canvas/syllabus candidates. Uses
 * `getGmailAIClient()` (Groq, falling back to the global Gemini client —
 * docs/DECISIONS/0003-groq-for-gmail-extraction.md) rather than
 * `getAIClient()` directly, so this feature can run on a different provider
 * than chat/inbox/syllabus extraction. The full message body is always sent
 * — see `runExtraction` for what happens if Groq rejects it as too large.
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
  const extracted = await runExtraction(client, messageText);
  if (!extracted.ok) {
    return { ok: false, error: extracted.error };
  }

  const parsed = GmailExtractionResultSchema.safeParse(extracted.data);
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
