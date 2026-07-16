import { afterEach, describe, expect, it, vi } from "vitest";
import { getAIClient, isAIExtractionEnabled } from "./index";

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
