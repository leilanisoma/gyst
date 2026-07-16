import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { AIClient } from "@/ai/client";
import { extractPdfPages } from "@/lib/syllabus/pdf-text";
import { chunkPages, chunkText, type TextChunk } from "./chunk-text";

export type IndexDocumentResult =
  | { ok: true; chunksIndexed: number; chunksReused: number }
  | { ok: false; error: string };

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Downloads a document, extracts its text (PDF pages or plain text),
 * chunks it, and (re-)embeds it into `document_chunks` for
 * `search_documents` (PLAN.md §12 retrieval pipeline, task 8.4). Re-running
 * this on an unchanged document re-embeds nothing — chunks are matched to
 * their previous embedding by content hash, not by position, so edits that
 * shift text around still reuse whatever chunks are byte-identical
 * (PLAN.md §4 "cache results by input hash").
 */
export async function indexDocumentForSearch(
  supabase: SupabaseClient<Database>,
  aiClient: AIClient,
  userId: string,
  documentId: string,
): Promise<IndexDocumentResult> {
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, storage_path, mime_type")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (docError || !doc) {
    return { ok: false, error: docError?.message ?? "Document not found." };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);
  if (downloadError || !file) {
    return {
      ok: false,
      error: downloadError?.message ?? "Failed to download document.",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const chunks: TextChunk[] =
    doc.mime_type === "application/pdf"
      ? chunkPages(await extractPdfPages(buffer))
      : chunkText(buffer.toString("utf8"), null);

  if (chunks.length === 0) {
    await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);
    return { ok: true, chunksIndexed: 0, chunksReused: 0 };
  }

  const { data: existing, error: existingError } = await supabase
    .from("document_chunks")
    .select("content_hash, embedding")
    .eq("document_id", documentId);
  if (existingError) return { ok: false, error: existingError.message };

  const embeddingByHash = new Map<string, unknown>();
  for (const row of existing ?? []) {
    if (row.embedding != null)
      embeddingByHash.set(row.content_hash, row.embedding);
  }

  let reused = 0;
  const rows: {
    user_id: string;
    document_id: string;
    chunk_index: number;
    content: string;
    content_hash: string;
    page: number | null;
    embedding: unknown;
  }[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const hash = hashContent(chunk.content);
    const cached = embeddingByHash.get(hash);
    let embedding: unknown = cached;
    if (cached !== undefined) {
      reused++;
    } else {
      embedding = await aiClient.embedText(chunk.content);
    }
    rows.push({
      user_id: userId,
      document_id: documentId,
      chunk_index: i,
      content: chunk.content,
      content_hash: hash,
      page: chunk.page,
      embedding,
    });
  }

  const { error: deleteError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId);
  if (deleteError) return { ok: false, error: deleteError.message };

  const { error: insertError } = await supabase
    .from("document_chunks")
    .insert(rows as never);
  if (insertError) return { ok: false, error: insertError.message };

  return { ok: true, chunksIndexed: rows.length, chunksReused: reused };
}
