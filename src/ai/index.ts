import type { AIClient } from "./client";
import { createGeminiClient } from "./providers/gemini";
import { createGroqClient } from "./providers/groq";

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

/**
 * Gmail extraction only (docs/DECISIONS/0003-groq-for-gmail-extraction.md)
 * — uses Groq instead of the global `AI_PROVIDER` for this one feature,
 * since it's a cheap/fast classification-only task. Falls back to
 * `getAIClient()` (Gemini) when `GROQ_API_KEY` is unset, so removing the
 * key degrades Gmail extraction back to Gemini rather than disabling it.
 */
export function getGmailAIClient(): AIClient | null {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) return createGroqClient(groqApiKey);
  return getAIClient();
}
