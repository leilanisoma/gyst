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
