"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmGmailItem,
  dismissGmailItem,
  draftGmailReply,
} from "@/app/(app)/gmail/actions";

export type GmailItemKind = "interview" | "confirmation" | "deadline" | "action" | "other";

export const GMAIL_ITEM_KIND_LABELS: Record<GmailItemKind, string> = {
  interview: "Interview",
  confirmation: "Confirmation",
  deadline: "Deadline",
  action: "Action requested",
  other: "Other",
};

export type GmailItemRow = {
  id: string;
  gmail_thread_id: string;
  kind: GmailItemKind;
  title: string;
  excerpt: string | null;
  date_at: string | null;
  requested_action: string | null;
  confidence: number | null;
};

/** Works regardless of which label/folder the thread lives in (task 7.6). */
function gmailThreadLink(threadId: string): string {
  return `https://mail.google.com/mail/u/0/#all/${threadId}`;
}

export function GmailReviewQueue({ items }: { items: GmailItemRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftContent, setDraftContent] = useState("");

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing to review — sync Gmail from Settings once a search scope is set.
      </p>
    );
  }

  function confirm(id: string) {
    startTransition(async () => {
      const result = await confirmGmailItem(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Confirmed.");
    });
  }

  function dismiss(id: string) {
    startTransition(async () => {
      const result = await dismissGmailItem(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Dismissed.");
    });
  }

  function startDraft(item: GmailItemRow) {
    setDraftingId(item.id);
    setDraftSubject(item.title);
    setDraftContent("");
  }

  function submitDraft(itemId: string) {
    startTransition(async () => {
      const result = await draftGmailReply(itemId, {
        subject: draftSubject,
        content: draftContent,
      });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Draft saved — push it to Gmail from the Drafts section below.");
        setDraftingId(null);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className="text-sm font-semibold">Review queue</h2>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 border-b pb-3 text-sm last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{GMAIL_ITEM_KIND_LABELS[item.kind]}</Badge>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {item.excerpt && (
                    <p className="text-muted-foreground text-xs">{item.excerpt}</p>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {item.date_at ? `${new Date(item.date_at).toLocaleDateString()} · ` : ""}
                    {item.requested_action ? `${item.requested_action} · ` : ""}
                    {item.confidence != null ? `${Math.round(item.confidence * 100)}% confident` : ""}
                  </span>
                  <a
                    href={gmailThreadLink(item.gmail_thread_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline"
                  >
                    View in Gmail
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => startDraft(item)}>
                    Draft reply
                  </Button>
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => dismiss(item.id)}>
                    Dismiss
                  </Button>
                  <Button size="sm" disabled={isPending} onClick={() => confirm(item.id)}>
                    Confirm
                  </Button>
                </div>
              </div>

              {draftingId === item.id && (
                <div className="bg-muted flex flex-col gap-2 rounded-lg p-3">
                  <label className="text-xs font-medium">Subject</label>
                  <input
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="border-border bg-background rounded-md border px-2 py-1 text-sm"
                  />
                  <label className="text-xs font-medium">Reply</label>
                  <Textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={4}
                    placeholder="Write the reply manually — AI-assisted drafting isn't available yet."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={isPending || !draftContent.trim()} onClick={() => submitDraft(item.id)}>
                      Save draft
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setDraftingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
