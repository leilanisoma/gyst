"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CaptureResult = { ok: true } | { ok: false; error: string };

export async function captureInboxItem(
  rawText: string,
): Promise<CaptureResult> {
  const text = rawText.trim();
  if (!text) {
    return { ok: false, error: "Nothing to capture." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("inbox_items")
    .insert({ user_id: user.id, raw_text: text });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/inbox");
  revalidatePath("/");
  return { ok: true };
}

export type ConvertTarget = "task" | "note" | "goal";

export async function convertInboxItem(
  itemId: string,
  target: ConvertTarget,
): Promise<CaptureResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: item, error: fetchError } = await supabase
    .from("inbox_items")
    .select("id, raw_text")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return { ok: false, error: fetchError?.message ?? "Inbox item not found." };
  }

  let convertedId: string | null = null;

  if (target === "task") {
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: item.raw_text,
        source: "inbox",
        source_inbox_item_id: item.id,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    convertedId = task.id;
  } else if (target === "goal") {
    const { data: goal, error } = await supabase
      .from("goals")
      .insert({ user_id: user.id, title: item.raw_text })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    convertedId = goal.id;
  }
  // target === "note": kept in inbox_items as freeform text, no destination row.

  const { error: updateError } = await supabase
    .from("inbox_items")
    .update({
      status: "converted",
      converted_to: target,
      converted_id: convertedId,
    })
    .eq("id", itemId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/inbox");
  revalidatePath("/tasks");
  return { ok: true };
}
