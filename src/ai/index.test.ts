import { afterEach, describe, expect, it, vi } from "vitest";
import { getAIClient, getGmailAIClient, isAIExtractionEnabled } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI extraction feature flag", () => {
  it("is disabled with no provider configured", () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isAIExtractionEnabled()).toBe(false);
    expect(getAIClient()).toBeNull();
  });

  it("is disabled when AI_PROVIDER=gemini but no key is set", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isAIExtractionEnabled()).toBe(false);
    expect(getAIClient()).toBeNull();
  });

  it("returns a Gemini client when AI_PROVIDER=gemini and a key is set", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    expect(isAIExtractionEnabled()).toBe(true);
    const client = getAIClient();
    expect(client?.provider).toBe("gemini");
  });
});

describe("Gmail-scoped AI client", () => {
  it("returns a Groq client when GROQ_API_KEY is set", () => {
    vi.stubEnv("GROQ_API_KEY", "test-groq-key");
    const client = getGmailAIClient();
    expect(client?.provider).toBe("groq");
  });

  it("falls back to the global client (Gemini) when GROQ_API_KEY is unset", () => {
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const client = getGmailAIClient();
    expect(client?.provider).toBe("gemini");
  });

  it("returns null when neither Groq nor a global provider is configured", () => {
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(getGmailAIClient()).toBeNull();
  });
});
