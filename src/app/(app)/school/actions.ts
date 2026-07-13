"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runCanvasSync, type RunCanvasSyncResult } from "@/lib/canvas/sync";

export async function syncCanvasNow(): Promise<RunCanvasSyncResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const result = await runCanvasSync(supabase, user.id);
  revalidatePath("/school");
  return result;
}
