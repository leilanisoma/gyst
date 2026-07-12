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
