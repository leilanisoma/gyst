"use client";

import { useRef, useState, useTransition } from "react";
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
  rejectAssistantAction,
} from "@/app/(app)/chat/actions";

type Conversation = { id: string; title: string; updated_at: string };
type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};
type PendingAction = {
  id: string;
  action_type: string;
  preview: string;
  status: string;
};

export function ChatShell({
  conversations,
  activeConversationId,
  initialMessages,
  initialPendingActions,
}: {
  conversations: Conversation[];
  activeConversationId: string | null;
  initialMessages: Message[];
  initialPendingActions: PendingAction[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const value = draft.trim();
    if (!value || isSending) return;

    let conversationId = activeConversationId;
    if (!conversationId) {
      const created = await createConversation();
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      conversationId = created.id;
      router.push(`/chat?c=${conversationId}`);
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
      router.refresh();
    }
  }

  function handleApprove(actionId: string) {
    startTransition(async () => {
      const result = await approveAssistantAction(actionId);
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });
  }

  function handleReject(actionId: string) {
    startTransition(async () => {
      const result = await rejectAssistantAction(actionId);
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });
  }

  function handleNewConversation() {
    startTransition(async () => {
      const created = await createConversation();
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      router.push(`/chat?c=${created.id}`);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteConversation(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (id === activeConversationId) router.push("/chat");
      router.refresh();
    });
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
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
          {conversations.length === 0 && (
            <p className="text-muted-foreground text-xs">
              No conversations yet.
            </p>
          )}
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="group flex items-center gap-1"
            >
              <Link
                href={`/chat?c=${conversation.id}`}
                className={cn(
                  "flex-1 truncate rounded-lg px-2 py-1.5 text-sm",
                  conversation.id === activeConversationId
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

      <div className="flex flex-col gap-3">
        {initialPendingActions.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-2 py-3">
              <h2 className="text-sm font-semibold">
                Waiting for your approval
              </h2>
              {initialPendingActions.map((action) => (
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

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border p-4">
          {initialMessages.length === 0 && !pendingUserMessage && (
            <p className="text-muted-foreground text-sm">
              Ask about your tasks, schedule, school, recruiting, or documents.
            </p>
          )}
          {initialMessages.map((message) => (
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
