"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DocumentKind } from "@/lib/recruiting";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateDocumentInput = {
  kind: DocumentKind;
  title: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

/**
 * Records metadata for a file the browser already uploaded straight to the
 * private "documents" Storage bucket (RLS on storage.objects means the
 * client can do that upload itself — no need to proxy the file through a
 * server action).
 */
export async function createDocumentRecord(
  input: CreateDocumentInput,
): Promise<ActionResult> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Title can't be empty." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("documents").insert({
    user_id: user.id,
    kind: input.kind,
    title,
    storage_path: input.storagePath,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !doc) {
    return { ok: false, error: fetchError?.message ?? "Document not found." };
  }

  await supabase.storage.from("documents").remove([doc.storage_path]);

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}

/** Marks one document as the active version for its kind (e.g. "current resume"), demoting the rest. */
export async function setActiveDocument(
  documentId: string,
  kind: DocumentKind,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error: clearError } = await supabase
    .from("documents")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("kind", kind);
  if (clearError) {
    return { ok: false, error: clearError.message };
  }

  const { error: setError } = await supabase
    .from("documents")
    .update({ is_active: true })
    .eq("id", documentId)
    .eq("user_id", user.id);
  if (setError) {
    return { ok: false, error: setError.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}
