import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { AIClient } from "@/ai/client";
import type { GmailMessageContent } from "./client";

let fakeClient: AIClient | null = null;
vi.mock("@/ai", () => ({ getGmailAIClient: () => fakeClient }));

const MESSAGE: GmailMessageContent = {
  id: "msg-1",
  threadId: "thread-1",
  subject: "Interview scheduled",
  from: "recruiter@company.com",
  messageIdHeader: "<abc@mail.gmail.com>",
  snippet: "...",
  bodyText: "Can you do 2pm Friday for a phone screen?",
};

describe("extractGmailItemsFromMessage", () => {
  it("returns a clear error when no AI provider is configured (the real state today)", async () => {
    fakeClient = null;
    const { extractGmailItemsFromMessage } = await import("./extract");
    const db = new FakeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await extractGmailItemsFromMessage(db as any, "user-1", MESSAGE, 30);
    expect(result).toEqual({
      ok: false,
      error: "AI extraction isn't available yet — no provider is configured.",
    });
  });

  it("inserts an unconfirmed gmail_item with an encrypted excerpt and a retention-based expiry once a provider exists", async () => {
    vi.stubEnv("ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
    fakeClient = {
      provider: "fake",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async () => ({ items: [] }),
      extractGmailMessage: async () => ({
        items: [
          {
            kind: "interview",
            title: "Phone screen — Friday 2pm",
            excerpt: "Can you do 2pm Friday for a phone screen?",
            date: "2026-07-17",
            requestedAction: "Confirm availability",
            confidence: 0.9,
          },
        ],
      }),
    };

    const { extractGmailItemsFromMessage } = await import("./extract");
    const db = new FakeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await extractGmailItemsFromMessage(db as any, "user-1", MESSAGE, 30);

    expect(result).toEqual({ ok: true, itemsCreated: 1 });
    expect(db.tables.gmail_items).toHaveLength(1);
    const row = db.tables.gmail_items![0];
    expect(row).toMatchObject({
      gmail_message_id: "msg-1",
      gmail_thread_id: "thread-1",
      kind: "interview",
      title: "Phone screen — Friday 2pm",
      confirmed: false,
    });
    expect(row.excerpt_encrypted).not.toBe("Can you do 2pm Friday for a phone screen?");
    expect(String(row.excerpt_encrypted).split(":")).toHaveLength(3);
    expect(new Date(row.expires_at as string).getTime()).toBeGreaterThan(Date.now());

    vi.unstubAllEnvs();
  });

  it("creates no rows when the AI reports no candidates in the message", async () => {
    fakeClient = {
      provider: "fake",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async () => ({ items: [] }),
      extractGmailMessage: async () => ({ items: [] }),
    };
    const { extractGmailItemsFromMessage } = await import("./extract");
    const db = new FakeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await extractGmailItemsFromMessage(db as any, "user-1", MESSAGE, 30);
    expect(result).toEqual({ ok: true, itemsCreated: 0 });
    expect(db.tables.gmail_items ?? []).toHaveLength(0);
  });
});
