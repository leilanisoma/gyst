import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { AIClient } from "@/ai/client";
import type { ChatTurnResult } from "@/ai/types";
import { runChatTurn } from "./orchestrator";

afterEach(() => {
  vi.unstubAllEnvs();
});

function fakeClient(chatResponses: ChatTurnResult[]): AIClient {
  let call = 0;
  return {
    provider: "fake",
    extractInboxItem: async () => ({ items: [] }),
    extractSyllabusItems: async () => ({ items: [] }),
    extractGmailMessage: async () => ({ items: [] }),
    async chat() {
      const response = chatResponses[Math.min(call, chatResponses.length - 1)];
      call++;
      return response;
    },
    embedText: async () => [0.1, 0.2],
  };
}

function baseParams(supabase: FakeSupabase, aiClient: AIClient) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: supabase as any,
    aiClient,
    userId: "user-1",
    conversationId: "conv-1",
    userMessage: "what's on my plate today?",
    now: new Date("2026-07-15T12:00:00Z"),
    timezone: "America/Los_Angeles",
  };
}

describe("runChatTurn", () => {
  it("runs a tool call then returns the model's final text, persisting every message", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [];
    const client = fakeClient([
      {
        text: "",
        toolCalls: [{ id: "call_0", name: "get_tasks", args: {} }],
        usage: { inputTokens: 10, outputTokens: 5 },
      },
      {
        text: "You have no open tasks.",
        toolCalls: [],
        usage: { inputTokens: 15, outputTokens: 8 },
      },
    ]);

    const result = await runChatTurn(baseParams(db, client));

    expect(result).toMatchObject({ ok: true, text: "You have no open tasks." });
    const messages = db.tables.messages ?? [];
    expect(messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "tool",
      "assistant",
    ]);
    expect(messages[2].tool_name).toBe("get_tasks");
    expect(String(messages[2].content)).toContain("<untrusted_data");
  });

  it("wraps an unknown tool call as an error instead of crashing the turn", async () => {
    const db = new FakeSupabase();
    const client = fakeClient([
      {
        text: "",
        toolCalls: [{ id: "call_0", name: "delete_everything", args: {} }],
        usage: { inputTokens: 1, outputTokens: 1 },
      },
      {
        text: "Done.",
        toolCalls: [],
        usage: { inputTokens: 1, outputTokens: 1 },
      },
    ]);

    const result = await runChatTurn(baseParams(db, client));

    expect(result.ok).toBe(true);
    const toolMessage = (db.tables.messages ?? []).find(
      (m) => m.role === "tool",
    );
    expect(String(toolMessage?.content)).toContain("Unknown tool");
  });

  it("stops after the tool round-trip cap instead of looping forever", async () => {
    const alwaysCallsTool: ChatTurnResult = {
      text: "",
      toolCalls: [{ id: "call_x", name: "get_tasks", args: {} }],
      usage: { inputTokens: 1, outputTokens: 1 },
    };
    const db = new FakeSupabase();
    db.tables.tasks = [];
    const client = fakeClient([alwaysCallsTool]);
    const chatSpy = vi.spyOn(client, "chat");

    const result = await runChatTurn(baseParams(db, client));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toMatch(/stopped/i);
    }
    expect(chatSpy).toHaveBeenCalledTimes(6);
  });

  it("refuses to run once the daily chat token budget is exhausted, without writing anything", async () => {
    vi.stubEnv("AI_CHAT_DAILY_TOKEN_LIMIT", "100");
    const db = new FakeSupabase();
    db.tables.ai_usage_events = [
      {
        user_id: "user-1",
        feature: "chat",
        input_tokens: 80,
        output_tokens: 30,
        created_at: new Date().toISOString(),
      },
    ];
    const client = fakeClient([
      {
        text: "should not be called",
        toolCalls: [],
        usage: { inputTokens: 0, outputTokens: 0 },
      },
    ]);
    const chatSpy = vi.spyOn(client, "chat");

    const result = await runChatTurn(baseParams(db, client));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/daily/i);
    expect(chatSpy).not.toHaveBeenCalled();
    expect(db.tables.messages ?? []).toHaveLength(0);
  });

  it("proposing an action only ever creates a preview row — never the real write", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [];
    const client = fakeClient([
      {
        text: "",
        toolCalls: [
          {
            id: "call_0",
            name: "propose_action",
            args: {
              actionType: "create_task",
              arguments: { title: "Email advisor" },
              preview: "Create task 'Email advisor'",
            },
          },
        ],
        usage: { inputTokens: 1, outputTokens: 1 },
      },
      {
        text: "I've proposed that task — approve it below.",
        toolCalls: [],
        usage: { inputTokens: 1, outputTokens: 1 },
      },
    ]);

    const result = await runChatTurn(baseParams(db, client));

    expect(result.ok).toBe(true);
    expect(db.tables.tasks ?? []).toHaveLength(0);
    expect(db.tables.assistant_actions).toHaveLength(1);
    expect(db.tables.assistant_actions![0]).toMatchObject({
      status: "proposed",
      action_type: "create_task",
    });
  });
});
