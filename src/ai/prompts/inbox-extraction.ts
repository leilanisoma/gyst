/**
 * Prompt for Inbox brain-dump extraction (PLAN.md §15 Phase 1's "AI
 * extraction behind a feature flag"). Kept as a versioned file per
 * CLAUDE.md's "prompts are versioned files under src/ai/prompts/, not
 * inline strings" rule — provider adapters import this instead of
 * embedding the text themselves, so every provider extracts the same way.
 */
export function buildInboxExtractionPrompt(rawText: string): string {
  return (
    `Extract structured tasks, notes, and goals from this brain-dump text. ` +
    `Classify each distinct item as "task" (an action to do), "note" ` +
    `(information to remember), or "goal" (a longer-term aim). Assign a ` +
    `confidence score between 0 and 1 for each. If nothing extractable is ` +
    `present, return an empty items array.\n\n` +
    `Text:\n${rawText}`
  );
}
