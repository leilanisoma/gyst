"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";
import { indexDocumentForSearch } from "@/lib/chat/document-index";

export type IndexActionResult =
  | { ok: true; chunksIndexed: number; chunksReused: number }
  | { ok: false; error: string };

/** Chunks + embeds one document so search_documents can find it (task 8.4). Safe to re-run — unchanged chunks skip re-embedding. */
export async function indexDocument(
  documentId: string,
): Promise<IndexActionResult> {
  const aiClient = getAIClient();
  if (!aiClient) {
    return {
      ok: false,
      error:
        "Search indexing isn't available yet — no AI provider is configured.",
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const result = await indexDocumentForSearch(
    supabase,
    aiClient,
    user.id,
    documentId,
  );
  if (!result.ok) return result;

  revalidatePath("/chat/memory");
  return result;
}
