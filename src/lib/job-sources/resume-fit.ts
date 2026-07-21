import type { createClient } from "@/lib/supabase/server";
import type { SupabaseServiceClient } from "@/lib/supabase/service";
import { extractPdfPages } from "@/lib/syllabus/pdf-text";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AnySupabaseClient = SupabaseServerClient | SupabaseServiceClient;

/**
 * Plain text of the user's active resume (`documents` kind "resume",
 * `is_active`), for the discovery pipeline's education-fit classification
 * (`src/ai/prompts/education-fit.ts`). Re-extracts from storage directly
 * rather than reading `document_chunks` — that table only has rows once a
 * document has been indexed for chat search (`indexDocumentForSearch`),
 * which a resume may never have gone through, and a resume is short enough
 * that fetching the whole text needs no chunking/embedding step anyway.
 * Returns null (not an error) when there's no active resume — callers skip
 * the classification and leave `requiresUnmetEducation` unset rather than
 * blocking discovery on a resume that hasn't been uploaded yet.
 */
export async function getActiveResumeText(
  supabase: AnySupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, mime_type")
    .eq("user_id", userId)
    .eq("kind", "resume")
    .eq("is_active", true)
    .maybeSingle();
  if (!doc) return null;

  const { data: file, error } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);
  if (error || !file) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  if (doc.mime_type === "application/pdf") {
    const pages = await extractPdfPages(buffer);
    return pages.map((page) => page.text).join("\n\n");
  }
  return buffer.toString("utf8");
}
