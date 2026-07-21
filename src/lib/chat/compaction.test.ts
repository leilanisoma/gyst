import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { AIClient } from "@/ai/client";
import { compactConversationIfNeeded } from "./compaction";

function fakeClient(text: string): AIClient {
  return {
    provider: "fake",
    extractInboxItem: async () => ({ items: [] }),
    extractSyllabusItems: async () => ({ items: [] }),
    extractGmailMessage: async () => ({ items: [] }),
    chat: async () => ({
      text,
      toolCalls: [],
      usage: { inputTokens: 0, outputTokens: 0 },
    }),
    embedText: async () => [],
    classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
  };
}

function seedMessages(db: FakeSupabase, conversationId: string, count: number) {
  db.tables.messages = Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    conversation_id: conversationId,
    role: i % 2 === 0 ? "user" : "assistant",
    content: `message ${i}`,
    created_at: new Date(2026, 0, 1, 0, i).toISOString(),
  }));
}

describe("compactConversationIfNeeded", () => {
  it("does nothing when the conversation is under the threshold", async () => {
    const db = new FakeSupabase();
    seedMessages(db, "conv-1", 5);
    const client = fakeClient("summary");
    const chatSpy = vi.spyOn(client, "chat");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await compactConversationIfNeeded(db as any, client, "conv-1");

    expect(chatSpy).not.toHaveBeenCalled();
    expect(db.tables.conversations ?? []).toHaveLength(0);
  });

  it("summarizes everything but the most recent messages once past the threshold", async () => {
    const db = new FakeSupabase();
    seedMessages(db, "conv-1", 25);
    db.tables.conversations = [
      { id: "conv-1", summary: null, summary_through_created_at: null },
    ];
    const client = fakeClient(
      "Ishani discussed her recruiting pipeline and school deadlines.",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await compactConversationIfNeeded(db as any, client, "conv-1");

    const conversation = db.tables.conversations![0];
    expect(conversation.summary).toBe(
      "Ishani discussed her recruiting pipeline and school deadlines.",
    );
    // through the 15th message (25 - 10 kept in full)
    expect(conversation.summary_through_created_at).toBe(
      new Date(2026, 0, 1, 0, 14).toISOString(),
    );
  });

  it("folds a new summary in on top of an existing one instead of dropping it", async () => {
    const db = new FakeSupabase();
    seedMessages(db, "conv-1", 25);
    db.tables.conversations = [
      {
        id: "conv-1",
        summary: "Earlier: discussed resume draft.",
        summary_through_created_at: null,
      },
    ];
    const client = fakeClient("Combined summary.");
    const chatSpy = vi.spyOn(client, "chat");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await compactConversationIfNeeded(db as any, client, "conv-1");

    const [call] = chatSpy.mock.calls;
    expect(call[0].messages[0].content).toContain(
      "Earlier: discussed resume draft.",
    );
    expect(db.tables.conversations![0].summary).toBe("Combined summary.");
  });
});
