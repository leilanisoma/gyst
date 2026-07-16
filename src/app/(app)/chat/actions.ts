"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  approveAssistantAction as approveAssistantActionLib,
  rejectAssistantAction as rejectAssistantActionLib,
} from "@/lib/chat/approve-action";
import { loadChatPanelData, type ChatPanelData } from "@/lib/chat/panel-data";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Client-driven refetch of a conversation's full panel state — used by
 * `ChatShell` after every mutation (send/approve/reject/new/delete) instead
 * of `router.refresh()`, since the floating chat widget has no
 * server-rendered page props to refresh. The `/chat` page still does its
 * own server-side `loadChatPanelData` call for the first paint; this is
 * the same function, just reachable from a client component.
 */
export async function getChatPanelData(
  conversationId: string | null,
): Promise<{ ok: true; data: ChatPanelData } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Not signed in." };

  const data = await loadChatPanelData(supabase, conversationId);
  return { ok: true, data };
}

export async function createConversation(): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/chat");
  return { ok: true, id: data.id };
}

export async function renameConversation(
  id: string,
  title: string,
): Promise<ActionResult> {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Title can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ title: trimmed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/chat");
  return { ok: true };
}

export async function deleteConversation(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/chat");
  return { ok: true };
}

export async function approveAssistantAction(
  actionId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const result = await approveAssistantActionLib(supabase, user.id, actionId);

  revalidatePath("/chat");
  revalidatePath("/tasks");
  revalidatePath("/");
  return result;
}

export async function rejectAssistantAction(
  actionId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, error: "Not signed in." };

  const result = await rejectAssistantActionLib(supabase, user.id, actionId);

  revalidatePath("/chat");
  return result;
}
