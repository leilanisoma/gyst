import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";
import { ComingSoon } from "@/components/coming-soon";
import { ChatShell } from "@/components/chat/chat-shell";
import { buttonVariants } from "@/components/ui/button";
import { loadChatPanelData } from "@/lib/chat/panel-data";

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
  const data = await loadChatPanelData(supabase, requestedId ?? null);

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
        key={data.activeConversationId ?? "new"}
        mode="page"
        initial={data}
      />
    </main>
  );
}
