import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import {
  getDailyChatTokenLimit,
  getTodayFeatureTokenUsage,
  recordUsage,
} from "./usage";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getDailyChatTokenLimit", () => {
  it("defaults to a generous limit when unset", () => {
    expect(getDailyChatTokenLimit()).toBe(200_000);
  });

  it("honors AI_CHAT_DAILY_TOKEN_LIMIT when set to a valid positive number", () => {
    vi.stubEnv("AI_CHAT_DAILY_TOKEN_LIMIT", "5000");
    expect(getDailyChatTokenLimit()).toBe(5000);
  });

  it("falls back to the default for garbage input", () => {
    vi.stubEnv("AI_CHAT_DAILY_TOKEN_LIMIT", "not-a-number");
    expect(getDailyChatTokenLimit()).toBe(200_000);
  });
});

describe("recordUsage / getTodayFeatureTokenUsage", () => {
  it("sums today's input+output tokens for the given feature only", async () => {
    const db = new FakeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await recordUsage(db as any, "user-1", "chat", "gemini", {
      inputTokens: 100,
      outputTokens: 20,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await recordUsage(db as any, "user-1", "chat", "gemini", {
      inputTokens: 50,
      outputTokens: 10,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await recordUsage(db as any, "user-1", "embedding", "gemini", {
      inputTokens: 999,
      outputTokens: 0,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = await getTodayFeatureTokenUsage(db as any, "user-1", "chat");
    expect(total).toBe(180);
  });
});
