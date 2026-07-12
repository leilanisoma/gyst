"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DraftKind } from "@/lib/recruiting";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type DraftDocumentOption = { id: string; title: string };

/** All documents for the current user, for the resume/evidence pickers on the draft form. */
export async function listDraftDocumentOptions(): Promise<DraftDocumentOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, title, kind")
    .order("created_at", { ascending: false });
  return (data ?? []).map((doc) => ({
    id: doc.id,
    title: `${doc.title} (${doc.kind})`,
  }));
}

export type CreateDraftInput = {
  kind: DraftKind;
  content: string;
  resumeDocumentId: string | null;
  evidenceDocumentIds: string[];
  unsupportedClaims: string[];
};

export async function createDraft(
  applicationId: string,
  input: CreateDraftInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("drafts").insert({
    user_id: user.id,
    application_id: applicationId,
    kind: input.kind,
    content: input.content,
    resume_document_id: input.resumeDocumentId,
    evidence_document_ids: input.evidenceDocumentIds,
    unsupported_claims: input.unsupportedClaims,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}

export type UpdateDraftInput = {
  content: string;
  unsupportedClaims: string[];
  status: "draft" | "approved" | "exported";
};

export async function updateDraft(
  draftId: string,
  input: UpdateDraftInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("drafts")
    .update({
      content: input.content,
      unsupported_claims: input.unsupportedClaims,
      status: input.status,
    })
    .eq("id", draftId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}

export async function deleteDraft(draftId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("drafts").delete().eq("id", draftId);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/recruiting");
  return { ok: true };
}
