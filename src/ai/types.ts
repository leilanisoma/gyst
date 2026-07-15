import { z } from "zod";

export const ExtractedItemSchema = z.object({
  type: z.enum(["task", "note", "goal"]),
  text: z.string().min(1),
  confidence: z.number().min(0).max(1),
});
export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;

export const ExtractionResultSchema = z.object({
  items: z.array(ExtractedItemSchema),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

export const SyllabusItemCandidateSchema = z.object({
  kind: z.enum(["policy", "major_date", "other"]),
  title: z.string().min(1),
  description: z.string().nullable(),
  // ISO date string, null for policies with no specific date (e.g. "no late work accepted").
  date: z.string().nullable(),
  sourcePage: z.number().int().min(1).nullable(),
  confidence: z.number().min(0).max(1),
});
export type SyllabusItemCandidate = z.infer<typeof SyllabusItemCandidateSchema>;

export const SyllabusExtractionResultSchema = z.object({
  items: z.array(SyllabusItemCandidateSchema),
});
export type SyllabusExtractionResult = z.infer<typeof SyllabusExtractionResultSchema>;

export const GmailItemCandidateSchema = z.object({
  kind: z.enum(["interview", "confirmation", "deadline", "action", "other"]),
  title: z.string().min(1),
  // Short summary only — never the full message body (docs/DATA_CLASSIFICATION.md).
  excerpt: z.string().nullable(),
  // ISO date string: interview date, application deadline, etc.
  date: z.string().nullable(),
  requestedAction: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});
export type GmailItemCandidate = z.infer<typeof GmailItemCandidateSchema>;

export const GmailExtractionResultSchema = z.object({
  items: z.array(GmailItemCandidateSchema),
});
export type GmailExtractionResult = z.infer<typeof GmailExtractionResultSchema>;
