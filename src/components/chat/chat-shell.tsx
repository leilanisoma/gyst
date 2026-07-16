"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  approveAssistantAction,
  createConversation,
  deleteConversation,
  getChatPanelData,
  rejectAssistantAction,
} from "@/app/(app)/chat/actions";
import type { ChatPanelData } from "@/lib/chat/panel-data";

/**
 * Shared by the full `/chat` page and the floating chat widget
 * (`src/components/chat/floating-chat.tsx`). `mode="page"` keeps the
 * conversation sidebar and reflects the active conversation in the URL
 * (so it's bookmarkable/back-button-able); `mode="floating"` drops the
 * sidebar (a corner widget has no room for one) and never touches the
 * URL — it just continues the most recent conversation and refetches its
 * own state after every mutation instead of relying on `router.refresh()`,
 * since it isn't tied to a server-rendered page's props.
 */
export function ChatShell({
  mode,
  initial,
}: {
  mode: "page" | "floating";
  initial: ChatPanelData;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState(initial);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Page mode gets a fresh `initial` from the server on every conversation
  // switch, but React doesn't remount this component just because a prop
  // changed — the caller (`/chat/page.tsx`) sets `key={activeConversationId}`
  // so switching conversations remounts ChatShell with fresh state instead
  // of needing an effect to sync props into state (react-hooks/set-state-in-effect).

  // Floating mode has no server-rendered props of its own (it's mounted
  // inside a client-side Sheet) — load real data as soon as it appears.
  useEffect(() => {
    if (mode === "floating") refresh(initial.activeConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh(conversationId: string | null) {
    const result = await getChatPanelData(conversationId);
    if (result.ok) {
      setPanel(result.data);
    } else {
      toast.error(result.error);
    }
  }

  async function handleSend() {
    const value = draft.trim();
    if (!value || isSending) return;

    let conversationId = panel.activeConversationId;
    if (!conversationId) {
      const created = await createConversation();
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      conversationId = created.id;
      if (mode === "page") router.push(`/chat?c=${conversationId}`);
    }

    setDraft("");
    setPendingUserMessage(value);
    setStreamingText("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: value }),
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "Chat request failed.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const line = event.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = JSON.parse(line.slice("data: ".length));
          if (payload.type === "delta") {
            text += payload.text;
            setStreamingText(text);
          } else if (payload.type === "error") {
            toast.error(payload.error);
          }
        }
      }
    } catch {
      toast.error("Lost connection while streaming the reply.");
    } finally {
      setIsSending(false);
      setPendingUserMessage(null);
      setStreamingText(null);
      await refresh(conversationId);
    }
  }

  function handleApprove(actionId: string) {
    startTransition(async () => {
      const result = await approveAssistantAction(actionId);
      if (!result.ok) toast.error(result.error);
      await refresh(panel.activeConversationId);
    });
  }

  function handleReject(actionId: string) {
    startTransition(async () => {
      const result = await rejectAssistantAction(actionId);
      if (!result.ok) toast.error(result.error);
      await refresh(panel.activeConversationId);
    });
  }

  function handleNewConversation() {
    startTransition(async () => {
      const created = await createConversation();
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      if (mode === "page") {
        router.push(`/chat?c=${created.id}`);
      } else {
        await refresh(created.id);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteConversation(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (id === panel.activeConversationId) {
        if (mode === "page") router.push("/chat");
        else await refresh(null);
      }
    });
  }

  return (
    <div
      className={
        mode === "page"
          ? "grid flex-1 grid-cols-1 gap-4 md:grid-cols-[220px_1fr]"
          : "flex h-full min-h-0 flex-1 flex-col gap-3 p-4"
      }
    >
      {mode === "page" && (
        <aside className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleNewConversation}
            disabled={isPending}
          >
            New conversation
          </Button>
          <div className="flex flex-col gap-1">
            {panel.conversations.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No conversations yet.
              </p>
            )}
            {panel.conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="group flex items-center gap-1"
              >
                <Link
                  href={`/chat?c=${conversation.id}`}
                  className={cn(
                    "flex-1 truncate rounded-lg px-2 py-1.5 text-sm",
                    conversation.id === panel.activeConversationId
                      ? "bg-muted font-medium"
                      : "hover:bg-muted/50",
                  )}
                >
                  {conversation.title || "New conversation"}
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(conversation.id)}
                  className="text-muted-foreground px-1 text-xs opacity-0 group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {mode === "floating" && (
          <div className="flex items-center justify-between text-xs">
            <Link
              href="/chat"
              className="text-muted-foreground underline underline-offset-2"
            >
              Open full chat
            </Link>
            <Link
              href="/chat/memory"
              className="text-muted-foreground underline underline-offset-2"
            >
              Memory
            </Link>
          </div>
        )}

        {panel.pendingActions.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-2 py-3">
              <h2 className="text-sm font-semibold">
                Waiting for your approval
              </h2>
              {panel.pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>{action.preview}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleApprove(action.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleReject(action.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border p-4">
          {panel.messages.length === 0 && !pendingUserMessage && (
            <p className="text-muted-foreground text-sm">
              Ask about your tasks, schedule, school, recruiting, or documents.
            </p>
          )}
          {panel.messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}
          {pendingUserMessage && (
            <MessageBubble role="user" content={pendingUserMessage} />
          )}
          {streamingText !== null && (
            <MessageBubble role="assistant" content={streamingText || "…"} />
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
          className="flex flex-col gap-2"
        >
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask GYST anything about your tasks, schedule, school, recruiting, or documents…"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              ⌘/Ctrl + Enter to send
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={!draft.trim() || isSending}
            >
              {isSending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
        isUser
          ? "bg-primary text-primary-foreground self-end"
          : "bg-muted self-start",
      )}
    >
      {content}
    </div>
  );
}
