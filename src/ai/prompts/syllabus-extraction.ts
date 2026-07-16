/**
 * Prompt for syllabus policy/major-date extraction (PLAN.md §15 task 6.6).
 * Kept as a versioned file per CLAUDE.md's "prompts are versioned files
 * under src/ai/prompts/, not inline strings" rule.
 */
export function buildSyllabusExtractionPrompt(syllabusText: string): string {
  return (
    `Extract policies and major dates from this course syllabus. The text ` +
    `is marked with page boundaries like "--- Page N ---" (see ` +
    `src/lib/syllabus/pdf-text.ts) — report the page each item appears on ` +
    `as sourcePage, or null if not tied to a specific page. Classify each ` +
    `item as "policy" (a course rule, e.g. late work or attendance), ` +
    `"major_date" (an exam, assignment due date, or other dated event), or ` +
    `"other". Use ISO date strings (YYYY-MM-DD) for date, or null if the ` +
    `item has no specific date. Assign a confidence score between 0 and ` +
    `1.\n\n` +
    `Syllabus:\n${syllabusText}`
  );
}
