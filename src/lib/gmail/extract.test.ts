import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { AIClient } from "@/ai/client";
import { GroqApiError } from "@/ai/providers/groq";
import type { GmailMessageContent } from "./client";

let fakeClient: AIClient | null = null;
let fakeFallbackClient: AIClient | null = null;
vi.mock("@/ai", () => ({
  getGmailAIClient: () => fakeClient,
  getAIClient: () => fakeFallbackClient,
}));

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

  it("falls back to Gemini with the full, untruncated body when Groq rejects a message as too large (real failure: a 94k-char email requested ~24k tokens against Groq's 8000/min cap)", async () => {
    vi.stubEnv("ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
    const groqExtract = vi
      .fn()
      .mockRejectedValue(new GroqApiError("Groq API request failed (413): too large", 413));
    const geminiExtract = vi.fn().mockResolvedValue({
      items: [
        {
          kind: "deadline",
          title: "Offer deadline",
          excerpt: "Respond by Friday",
          date: "2026-07-24",
          requestedAction: null,
          confidence: 0.8,
        },
      ],
    });
    fakeClient = {
      provider: "groq",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async () => ({ items: [] }),
      extractGmailMessage: groqExtract,
    };
    fakeFallbackClient = {
      provider: "gemini",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async () => ({ items: [] }),
      extractGmailMessage: geminiExtract,
    };

    const { extractGmailItemsFromMessage } = await import("./extract");
    const db = new FakeSupabase();
    const hugeMessage = { ...MESSAGE, bodyText: "x".repeat(100_000) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await extractGmailItemsFromMessage(db as any, "user-1", hugeMessage, 30);

    expect(result).toEqual({ ok: true, itemsCreated: 1 });
    expect(groqExtract).toHaveBeenCalledTimes(1);
    expect(geminiExtract).toHaveBeenCalledTimes(1);
    // Both providers see the exact same, full body — nothing was cut down.
    const [groqMessageText] = groqExtract.mock.calls[0];
    const [geminiMessageText] = geminiExtract.mock.calls[0];
    expect(groqMessageText).toBe(geminiMessageText);
    expect(groqMessageText).toContain("x".repeat(100_000));

    fakeFallbackClient = null;
    vi.unstubAllEnvs();
  });

  it("reports a clear error instead of throwing when Groq rejects a message and no fallback provider is configured", async () => {
    fakeClient = {
      provider: "groq",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async () => ({ items: [] }),
      extractGmailMessage: vi
        .fn()
        .mockRejectedValue(new GroqApiError("Groq API request failed (413): too large", 413)),
    };
    fakeFallbackClient = null;

    const { extractGmailItemsFromMessage } = await import("./extract");
    const db = new FakeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await extractGmailItemsFromMessage(db as any, "user-1", MESSAGE, 30);

    expect(result).toEqual({
      ok: false,
      error: "Groq API request failed (413): too large",
    });
    expect(db.tables.gmail_items ?? []).toHaveLength(0);
  });

  it("does not retry on Gemini for a non-capacity error (e.g. a malformed-response bug) — only 413/429 from Groq triggers the fallback", async () => {
    const geminiExtract = vi.fn();
    fakeClient = {
      provider: "groq",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async () => ({ items: [] }),
      extractGmailMessage: vi.fn().mockRejectedValue(new Error("boom")),
    };
    fakeFallbackClient = {
      provider: "gemini",
      chat: async () => ({ text: "", toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } }),
      embedText: async () => [],
      classifyEducationFit: async () => ({ requiresUnmetEducation: false, reasoning: "" }),
      extractInboxItem: async () => ({ items: [] }),
      extractSyllabusItems: async () => ({ items: [] }),
      extractGmailMessage: geminiExtract,
    };

    const { extractGmailItemsFromMessage } = await import("./extract");
    const db = new FakeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await extractGmailItemsFromMessage(db as any, "user-1", MESSAGE, 30);

    expect(result).toEqual({ ok: false, error: "boom" });
    expect(geminiExtract).not.toHaveBeenCalled();

    fakeFallbackClient = null;
  });
});
