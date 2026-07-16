import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { AIClient } from "@/ai/client";

// Trigger once a conversation has grown past this many raw messages, and
// always leave the most recent KEEP_RECENT_MESSAGES in full so the model
// still sees exact recent turns, not just a summary of them.
const COMPACTION_MESSAGE_THRESHOLD = 20;
const KEEP_RECENT_MESSAGES = 10;

const COMPACTION_SYSTEM_INSTRUCTION =
  "You summarize an internal chat transcript concisely and factually, preserving names, dates, decisions, and open questions. Plain text only, third person, no preamble like 'Here is a summary'.";

/**
 * Folds everything but the most recent messages into `conversations.summary`
 * so long-running conversations don't grow the per-turn token cost or hit
 * context limits (PLAN.md §4/§15 task 8.7). The orchestrator appends this
 * summary to the system instruction and only sends messages newer than
 * `summary_through_created_at` as real turn history — this function never
 * deletes rows, so the chat UI's history view is unaffected.
 */
export async function compactConversationIfNeeded(
  supabase: SupabaseClient<Database>,
  aiClient: AIClient,
  conversationId: string,
): Promise<void> {
  const { data: messages, error } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error || !messages || messages.length <= COMPACTION_MESSAGE_THRESHOLD)
    return;

  const toSummarize = messages.slice(0, messages.length - KEEP_RECENT_MESSAGES);
  if (toSummarize.length === 0) return;

  const { data: conversation } = await supabase
    .from("conversations")
    .select("summary")
    .eq("id", conversationId)
    .maybeSingle();

  const transcript = toSummarize
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
  if (!transcript.trim()) return;

  const prompt = conversation?.summary
    ? `Existing summary of even earlier messages:\n${conversation.summary}\n\nNew messages to fold in:\n${transcript}\n\nWrite one updated summary covering everything above.`
    : `Messages to summarize:\n${transcript}`;

  const result = await aiClient.chat({
    systemInstruction: COMPACTION_SYSTEM_INSTRUCTION,
    messages: [{ role: "user", content: prompt }],
    tools: [],
  });
  if (!result.text.trim()) return;

  const lastSummarized = toSummarize[toSummarize.length - 1];
  await supabase
    .from("conversations")
    .update({
      summary: result.text,
      summary_through_created_at: lastSummarized.created_at,
    })
    .eq("id", conversationId);
}
