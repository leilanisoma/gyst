import type { ExtractionResult, SyllabusExtractionResult } from "./types";

/**
 * Provider-neutral interface so product code never depends on a specific
 * model or SDK (PLAN.md §4). Deterministic logic (permissions, scoring,
 * dedup) never lives behind this — only extraction, classification,
 * summarization, ranking explanations, drafting, and conversation.
 */
export interface AIClient {
  readonly provider: string;
  extractInboxItem(rawText: string): Promise<ExtractionResult>;
  /** `syllabusText` is page-marked (see `formatPagesForExtraction`) so the model can report a `sourcePage` per item. */
  extractSyllabusItems(syllabusText: string): Promise<SyllabusExtractionResult>;
}
