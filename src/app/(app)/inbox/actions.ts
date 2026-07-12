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
