import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ChatPanelData = {
  conversations: { id: string; title: string; updated_at: string }[];
  activeConversationId: string | null;
  messages: { id: string; role: string; content: string; created_at: string }[];
  pendingActions: {
    id: string;
    action_type: string;
    preview: string;
    status: string;
  }[];
};

export const EMPTY_CHAT_PANEL_DATA: ChatPanelData = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  pendingActions: [],
};

/**
 * Shared by the full `/chat` page (server-rendered) and the
 * `getChatPanelData` server action (client-driven refetch — used by the
 * page after a mutation, and by the floating chat widget on every load
 * since it has no server-rendered initial props of its own).
 */
export async function loadChatPanelData(
  supabase: SupabaseClient<Database>,
  requestedConversationId: string | null,
): Promise<ChatPanelData> {
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  const activeId = requestedConversationId ?? conversations?.[0]?.id ?? null;

  let messages: ChatPanelData["messages"] = [];
  let pendingActions: ChatPanelData["pendingActions"] = [];

  if (activeId) {
    const { data: messageRows } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true });
    messages = (messageRows ?? []).filter(
      (m) =>
        m.role === "user" ||
        (m.role === "assistant" && m.content.trim() !== ""),
    );

    const { data: actionRows } = await supabase
      .from("assistant_actions")
      .select("id, action_type, preview, status")
      .eq("conversation_id", activeId)
      .eq("status", "proposed")
      .order("created_at", { ascending: true });
    pendingActions = actionRows ?? [];
  }

  return {
    conversations: conversations ?? [],
    activeConversationId: activeId,
    messages,
    pendingActions,
  };
}
