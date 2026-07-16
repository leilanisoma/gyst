"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Moves a pending/model-suggested memory into the confirmed set Ishani has actually reviewed (PLAN.md §12 memory policy). */
export async function confirmMemoryItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("memory_items")
    .update({ status: "confirmed" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/chat/memory");
  return { ok: true };
}

export async function archiveMemoryItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("memory_items")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/chat/memory");
  return { ok: true };
}

/** Hard-deletes the memory item; `memory_links` cascade via FK, matching PLAN.md §12 "deleting a source can cascade to derived memory". */
export async function deleteMemoryItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("memory_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/chat/memory");
  return { ok: true };
}

export async function updateMemoryItemText(
  id: string,
  text: string,
): Promise<ActionResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Text can't be empty." };

  const supabase = await createClient();
  const updates: Record<string, unknown> = { text: trimmed };

  const aiClient = getAIClient();
  if (aiClient) {
    try {
      updates.embedding = await aiClient.embedText(trimmed);
    } catch {
      // Editing still succeeds even if re-embedding fails — search on this
      // item just stays stale until the next successful edit/re-index.
    }
  }

  const { error } = await supabase
    .from("memory_items")
    .update(updates as never)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/chat/memory");
  return { ok: true };
}

export async function exportMemory(): Promise<
  { ok: true; json: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("memory_items")
    .select(
      "id, kind, text, confidence, source, status, learned_at, last_used_at",
    )
    .eq("user_id", user.id)
    .neq("status", "deleted")
    .order("learned_at", { ascending: false });
  if (error) return { ok: false, error: error.message };

  return { ok: true, json: JSON.stringify(data ?? [], null, 2) };
}
