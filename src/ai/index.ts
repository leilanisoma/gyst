import type { AIClient } from "./client";

/**
 * No provider adapter exists yet (see
 * docs/DECISIONS/0001-phase-0-foundational-decisions.md). Both functions
 * below are the single source of truth for whether AI extraction is
 * live — update them together once a real adapter is wired in, so the
 * UI can never end up flag-on-but-broken.
 */
export function isAIExtractionEnabled(): boolean {
  return getAIClient() !== null;
}

export function getAIClient(): AIClient | null {
  return null;
}
