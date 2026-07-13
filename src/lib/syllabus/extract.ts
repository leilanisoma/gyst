import type { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";
import { SyllabusExtractionResultSchema } from "@/ai/types";
import { extractPdfPages, formatPagesForExtraction } from "./pdf-text";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ExtractSyllabusItemsResult =
  | { ok: true; itemsCreated: number }
  | { ok: false; error: string };

/**
 * Downloads a syllabus PDF, extracts per-page text (deterministic parsing),
 * and asks the configured AIClient to identify policies/major dates
 * (PLAN.md §15 task 6.6). Every item lands `confirmed: false` — same
 * require-confirmation rule as 6.4's Canvas candidates. Gated behind
 * `getAIClient()` the same way Inbox's "Extract with AI" is (`src/app/
 * (app)/inbox/actions.ts`); with no provider wired in yet, this always
 * returns the "not available" error and never runs.
 */
export async function extractSyllabusItemsFromDocument(
  supabase: SupabaseServerClient,
  userId: string,
  documentId: string,
): Promise<ExtractSyllabusItemsResult> {
  const client = getAIClient();
  if (!client) {
    return { ok: false, error: "AI extraction isn't available yet — no provider is configured." };
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, course_id, storage_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .eq("kind", "syllabus")
    .maybeSingle();
  if (docError || !doc) {
    return { ok: false, error: docError?.message ?? "Syllabus not found." };
  }
  const courseId = doc.course_id;
  if (!courseId) {
    return { ok: false, error: "Syllabus isn't linked to a course." };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);
  if (downloadError || !file) {
    return { ok: false, error: downloadError?.message ?? "Failed to download syllabus." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const pages = await extractPdfPages(buffer);
  const raw = await client.extractSyllabusItems(formatPagesForExtraction(pages));
  const parsed = SyllabusExtractionResultSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "AI returned an unexpected shape." };
  }
  if (parsed.data.items.length === 0) {
    return { ok: true, itemsCreated: 0 };
  }

  const { error: insertError } = await supabase.from("syllabus_items").insert(
    parsed.data.items.map((item) => ({
      user_id: userId,
      course_id: courseId,
      document_id: doc.id,
      kind: item.kind,
      title: item.title,
      description: item.description,
      date: item.date,
      source_page: item.sourcePage,
      confidence: item.confidence,
      confirmed: false,
    })),
  );
  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true, itemsCreated: parsed.data.items.length };
}
