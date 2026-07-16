import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { AIClient } from "@/ai/client";
import type { ChatMessageInput, ChatToolCall } from "@/ai/types";
import { buildChatSystemPrompt } from "@/ai/prompts/chat-system";
import { getRegisteredTool, listToolDeclarations } from "./tools";
import type { ToolContext } from "./tools/types";
import { wrapUntrustedContent } from "./untrusted-content";
import { compactConversationIfNeeded } from "./compaction";
import {
  getDailyChatTokenLimit,
  getTodayFeatureTokenUsage,
  recordUsage,
} from "./usage";

// Hard cap on model↔tool round-trips within one user turn — a cost/safety
// backstop against a runaway loop (a model that keeps calling tools without
// ever producing a final answer), independent of the daily token budget.
const MAX_TOOL_ROUNDTRIPS = 6;
const CHAT_FEATURE = "chat";

export type RunChatTurnParams = {
  supabase: SupabaseClient<Database>;
  aiClient: AIClient;
  userId: string;
  conversationId: string;
  userMessage: string;
  now: Date;
  timezone: string;
};

export type RunChatTurnResult =
  | { ok: true; assistantMessageId: string; text: string }
  | { ok: false; error: string };

type MessageRow = {
  id: string;
  role: string;
  content: string;
  tool_calls: Json | null;
  tool_call_id: string | null;
  tool_name: string | null;
};

function rowToMessageInput(row: MessageRow): ChatMessageInput {
  if (row.role === "user") return { role: "user", content: row.content };
  if (row.role === "tool") {
    return {
      role: "tool",
      toolCallId: row.tool_call_id ?? "",
      toolName: row.tool_name ?? "",
      content: row.content,
    };
  }
  return {
    role: "assistant",
    content: row.content,
    toolCalls:
      (row.tool_calls as unknown as ChatToolCall[] | null) ?? undefined,
  };
}

/**
 * Runs one full user turn: persists the user message, runs the model↔tool
 * loop (PLAN.md §12 retrieval pipeline), persists every message along the
 * way, and returns the final assistant text. Never performs a real write
 * itself — tools either read data or create a `proposed` preview row; only
 * a separate, explicitly user-initiated approval action
 * (src/app/(app)/chat/actions.ts) executes anything (CLAUDE.md "must never
 * ... write ... without explicit approval").
 */
export async function runChatTurn(
  params: RunChatTurnParams,
): Promise<RunChatTurnResult> {
  const dailyLimit = getDailyChatTokenLimit();
  const usedToday = await getTodayFeatureTokenUsage(
    params.supabase,
    params.userId,
    CHAT_FEATURE,
  );
  if (usedToday >= dailyLimit) {
    return {
      ok: false,
      error: `Daily AI chat usage limit reached (${usedToday}/${dailyLimit} tokens). Try again tomorrow.`,
    };
  }

  await compactConversationIfNeeded(
    params.supabase,
    params.aiClient,
    params.conversationId,
  );

  const { data: userRow, error: userInsertError } = await params.supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: "user",
      content: params.userMessage,
    })
    .select("id")
    .single();
  if (userInsertError || !userRow) {
    return {
      ok: false,
      error: userInsertError?.message ?? "Failed to save message.",
    };
  }

  const { data: conversation } = await params.supabase
    .from("conversations")
    .select("summary, summary_through_created_at")
    .eq("id", params.conversationId)
    .maybeSingle();

  let historyQuery = params.supabase
    .from("messages")
    .select(
      "id, role, content, tool_calls, tool_call_id, tool_name, created_at",
    )
    .eq("conversation_id", params.conversationId)
    .order("created_at", { ascending: true });
  if (conversation?.summary_through_created_at) {
    historyQuery = historyQuery.gt(
      "created_at",
      conversation.summary_through_created_at,
    );
  }
  const { data: historyRows, error: historyError } = await historyQuery;
  if (historyError) return { ok: false, error: historyError.message };

  let systemInstruction = buildChatSystemPrompt({
    now: params.now.toISOString(),
    timezone: params.timezone,
  });
  if (conversation?.summary) {
    systemInstruction += `\n\n## Summary of earlier conversation\n${conversation.summary}`;
  }

  const messages: ChatMessageInput[] = (historyRows ?? []).map(
    rowToMessageInput,
  );
  const tools = listToolDeclarations();

  let sourceMessageId: string = userRow.id;
  const toolContext: ToolContext = {
    supabase: params.supabase,
    userId: params.userId,
    embedText: (text) => params.aiClient.embedText(text),
    conversationId: params.conversationId,
    sourceMessageId,
  };

  let finalText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDTRIPS; round++) {
    const turn = await params.aiClient.chat({
      systemInstruction,
      messages,
      tools,
    });
    await recordUsage(
      params.supabase,
      params.userId,
      CHAT_FEATURE,
      params.aiClient.provider,
      turn.usage,
    );

    if (turn.toolCalls.length === 0) {
      finalText = turn.text;
      break;
    }

    messages.push({
      role: "assistant",
      content: turn.text,
      toolCalls: turn.toolCalls,
    });
    const { data: assistantRow } = await params.supabase
      .from("messages")
      .insert({
        conversation_id: params.conversationId,
        user_id: params.userId,
        role: "assistant",
        content: turn.text,
        tool_calls: turn.toolCalls as unknown as Json,
      })
      .select("id")
      .single();
    sourceMessageId = assistantRow?.id ?? sourceMessageId;
    toolContext.sourceMessageId = sourceMessageId;

    for (const call of turn.toolCalls) {
      const resultContent = await executeToolCall(toolContext, call);
      messages.push({
        role: "tool",
        toolCallId: call.id,
        toolName: call.name,
        content: resultContent,
      });
      await params.supabase.from("messages").insert({
        conversation_id: params.conversationId,
        user_id: params.userId,
        role: "tool",
        content: resultContent,
        tool_call_id: call.id,
        tool_name: call.name,
      });
    }

    if (round === MAX_TOOL_ROUNDTRIPS - 1) {
      finalText =
        "I made several tool calls without reaching a final answer, so I stopped — try asking something narrower.";
    }
  }

  const { data: finalRow, error: finalError } = await params.supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: "assistant",
      content: finalText,
    })
    .select("id")
    .single();
  if (finalError || !finalRow) {
    return {
      ok: false,
      error: finalError?.message ?? "Failed to save assistant reply.",
    };
  }

  await params.supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.conversationId);

  return { ok: true, assistantMessageId: finalRow.id, text: finalText };
}

/**
 * Executes exactly one tool call server-side. `getRegisteredTool` rejects
 * unknown names (task 8.6 tool authorization); `argsSchema.safeParse`
 * rejects malformed/malicious arguments before any tool code runs. The
 * result is always wrapped as untrusted data before it goes back to the
 * model, regardless of which tool produced it.
 */
async function executeToolCall(
  ctx: ToolContext,
  call: ChatToolCall,
): Promise<string> {
  const tool = getRegisteredTool(call.name);
  if (!tool) {
    return wrapUntrustedContent(
      `tool:${call.name}`,
      JSON.stringify({ error: `Unknown tool "${call.name}" — not available.` }),
    );
  }

  const parsedArgs = tool.argsSchema.safeParse(call.args);
  if (!parsedArgs.success) {
    return wrapUntrustedContent(
      `tool:${call.name}`,
      JSON.stringify({
        error: `Invalid arguments for "${call.name}": ${parsedArgs.error.message}`,
      }),
    );
  }

  try {
    const result = await tool.execute(ctx, parsedArgs.data);
    return wrapUntrustedContent(`tool:${call.name}`, JSON.stringify(result));
  } catch (err) {
    return wrapUntrustedContent(
      `tool:${call.name}`,
      JSON.stringify({
        error: err instanceof Error ? err.message : "Tool execution failed.",
      }),
    );
  }
}
