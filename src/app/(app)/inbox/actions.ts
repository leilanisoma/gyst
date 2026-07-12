"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";
import { ExtractionResultSchema, type ExtractedItem } from "@/ai/types";

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

export type ExtractResult =
  { ok: true; items: ExtractedItem[] } | { ok: false; error: string };

export async function extractInboxItem(itemId: string): Promise<ExtractResult> {
  const client = getAIClient();
  if (!client) {
    return {
      ok: false,
      error: "AI extraction isn't available yet — no provider is configured.",
    };
  }

  const supabase = await createClient();
  const { data: item, error: fetchError } = await supabase
    .from("inbox_items")
    .select("raw_text")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return { ok: false, error: fetchError?.message ?? "Inbox item not found." };
  }

  const raw = await client.extractInboxItem(item.raw_text);
  const parsed = ExtractionResultSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "AI returned an unexpected shape." };
  }

  return { ok: true, items: parsed.data.items };
}

export async function commitExtractedItems(
  itemId: string,
  accepted: ExtractedItem[],
): Promise<CaptureResult> {
  if (accepted.length === 0) {
    return { ok: false, error: "Nothing selected." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  let firstCreated: { type: ExtractedItem["type"]; id: string } | null = null;

  for (const candidate of accepted) {
    if (candidate.type === "task") {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: candidate.text,
          source: "inbox",
          source_inbox_item_id: itemId,
        })
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      firstCreated ??= { type: "task", id: data.id };
    } else if (candidate.type === "goal") {
      const { data, error } = await supabase
        .from("goals")
        .insert({ user_id: user.id, title: candidate.text })
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      firstCreated ??= { type: "goal", id: data.id };
    }
    // "note": no destination row, same as the manual conversion path.
  }

  const { error: updateError } = await supabase
    .from("inbox_items")
    .update({
      status: "converted",
      converted_to: firstCreated?.type ?? accepted[0].type,
      converted_id: firstCreated?.id ?? null,
    })
    .eq("id", itemId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/inbox");
  revalidatePath("/tasks");
  return { ok: true };
}
