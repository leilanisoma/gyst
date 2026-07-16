import type { AIClient } from "./client";
import { createGeminiClient } from "./providers/gemini";

/**
 * Both functions below are the single source of truth for whether AI
 * extraction is live — update them together when adding/removing a
 * provider, so the UI can never end up flag-on-but-broken. Gemini is the
 * only wired provider today (docs/DECISIONS/0002-gemini-ai-provider.md);
 * AI_PROVIDER picks among providers behind the same AIClient interface so
 * switching later doesn't touch product code (PLAN.md §4).
 */
export function isAIExtractionEnabled(): boolean {
  return getAIClient() !== null;
}

export function getAIClient(): AIClient | null {
  const provider = process.env.AI_PROVIDER;
  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return createGeminiClient(apiKey);
  }
  return null;
}
