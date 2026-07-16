import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";
import { ComingSoon } from "@/components/coming-soon";
import { ChatShell } from "@/components/chat/chat-shell";
import { buttonVariants } from "@/components/ui/button";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const aiClient = getAIClient();
  if (!aiClient) {
    return (
      <ComingSoon
        title="Chat"
        description="Chat needs an AI provider configured (AI_PROVIDER/GEMINI_API_KEY) before it can run."
      />
    );
  }

  const { c: requestedId } = await searchParams;
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  const activeId = requestedId ?? conversations?.[0]?.id ?? null;

  let messages: {
    id: string;
    role: string;
    content: string;
    created_at: string;
  }[] = [];
  let actions: {
    id: string;
    action_type: string;
    preview: string;
    status: string;
  }[] = [];

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
    actions = actionRows ?? [];
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Chat</h1>
          <p className="text-muted-foreground text-sm">
            Ask about tasks, schedule, school, recruiting, or stored documents.
          </p>
        </div>
        <Link
          href="/chat/memory"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Memory
        </Link>
      </div>
      <ChatShell
        conversations={conversations ?? []}
        activeConversationId={activeId}
        initialMessages={messages}
        initialPendingActions={actions}
      />
    </main>
  );
}
