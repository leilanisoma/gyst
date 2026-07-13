"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  extractSyllabusItemsFromDocument,
  type ExtractSyllabusItemsResult,
} from "@/lib/syllabus/extract";
import type { ActionResult } from "@/lib/assessments";

export async function extractSyllabusItemsAction(
  documentId: string,
): Promise<ExtractSyllabusItemsResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const result = await extractSyllabusItemsFromDocument(supabase, user.id, documentId);
  if (result.ok) revalidatePath("/school");
  return result;
}

export async function confirmSyllabusItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("syllabus_items").update({ confirmed: true }).eq("id", itemId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/school");
  return { ok: true };
}

export async function dismissSyllabusItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("syllabus_items").delete().eq("id", itemId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/school");
  return { ok: true };
}
