import type {
  ChatMessageInput,
  ChatTurnResult,
  EducationFitResult,
  ExtractionResult,
  GmailExtractionResult,
  SyllabusExtractionResult,
  ToolDeclaration,
} from "./types";

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
  /** `messageText` is one Gmail message's subject/from/body (PLAN.md §15 task 7.4) — never a whole thread or mailbox dump. */
  extractGmailMessage(messageText: string): Promise<GmailExtractionResult>;
  /**
   * One non-streaming model turn for the Phase 8 chatbot (PLAN.md §12).
   * `messages` is the full thread the caller wants the model to see
   * (system instruction passed separately since providers vary in how they
   * accept it); `tools`, when non-empty, enables function calling. The
   * orchestrator (`src/lib/chat/orchestrator.ts`) owns the tool-call loop —
   * this method makes exactly one request per call. Real chunk-by-chunk
   * token streaming isn't implemented (see `docs/PHASES/phase-8.md`); the
   * API route fakes transport-level streaming of the final text instead.
   */
  chat(params: {
    systemInstruction: string;
    messages: ChatMessageInput[];
    tools: ToolDeclaration[];
  }): Promise<ChatTurnResult>;
  /** Embeds one piece of text for pgvector storage/search (PLAN.md §4, §12 retrieval pipeline). Dimension is provider-specific — Gemini's text-embedding-004 returns 768. */
  embedText(text: string): Promise<number[]>;
  /**
   * Classifies whether a job posting explicitly requires an education level
   * (e.g. a PhD) beyond what the resume shows — feeds the recruiting fit
   * score's hard-exclusion check (PLAN.md §9 skills/experience,
   * `src/lib/job-scoring.ts`). Classification only; the score arithmetic
   * that uses this result stays in ordinary code per CLAUDE.md.
   */
  classifyEducationFit(
    resumeText: string,
    jobTitle: string,
    jobDescription: string | null,
  ): Promise<EducationFitResult>;
}
