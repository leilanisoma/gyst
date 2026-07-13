"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/assessments";

export type UploadSyllabusInput = {
  courseId: string;
  title: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

/**
 * Records metadata for a syllabus PDF the browser already uploaded to the
 * private "documents" Storage bucket — same upload pattern as recruiting's
 * documents (Phase 4), reusing the same table (`kind: "syllabus"`) and
 * bucket rather than a separate syllabus-specific one (PLAN.md §15 task
 * 6.5, in place of the `.ics` fallback since Canvas access isn't blocked).
 */
export async function uploadSyllabus(input: UploadSyllabusInput): Promise<ActionResult> {
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
    kind: "syllabus",
    course_id: input.courseId,
    title,
    storage_path: input.storagePath,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/school");
  return { ok: true };
}

export async function deleteSyllabus(documentId: string): Promise<ActionResult> {
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

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", documentId);
  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  revalidatePath("/school");
  return { ok: true };
}
