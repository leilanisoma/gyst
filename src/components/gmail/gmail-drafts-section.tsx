"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteGmailDraft,
  pushGmailDraft,
  updateGmailDraft,
} from "@/app/(app)/gmail/actions";

export type GmailDraftRow = {
  id: string;
  subject: string;
  content: string;
  status: "proposed" | "created";
};

export function GmailDraftsSection({
  drafts,
  hasComposeScope,
}: {
  drafts: GmailDraftRow[];
  hasComposeScope: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [edits, setEdits] = useState<Record<string, string>>({});

  if (drafts.length === 0) return null;

  function contentFor(draft: GmailDraftRow): string {
    return edits[draft.id] ?? draft.content;
  }

  function save(draft: GmailDraftRow) {
    startTransition(async () => {
      const result = await updateGmailDraft(draft.id, {
        subject: draft.subject,
        content: contentFor(draft),
      });
      if (!result.ok) toast.error(result.error);
      else toast.success("Draft saved.");
    });
  }

  function push(draftId: string) {
    startTransition(async () => {
      const result = await pushGmailDraft(draftId);
      if (!result.ok) toast.error(result.error);
      else toast.success("Created in your real Gmail drafts folder — open Gmail to send it.");
    });
  }

  function remove(draftId: string) {
    startTransition(async () => {
      const result = await deleteGmailDraft(draftId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className="text-sm font-semibold">
          Drafts
          <span className="text-muted-foreground font-normal">
            {" "}
            — never sent automatically; you always send from Gmail yourself
          </span>
        </h2>
        {!hasComposeScope && (
          <p className="text-muted-foreground text-xs">
            Enable draft-only replies in Settings to push these into your real
            Gmail account.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <li key={draft.id} className="flex flex-col gap-2 border-b pb-3 last:border-b-0">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={draft.status === "created" ? "secondary" : "outline"}>
                  {draft.status === "created" ? "In Gmail" : "Not sent yet"}
                </Badge>
                <span className="font-medium">{draft.subject}</span>
              </div>
              <Textarea
                value={contentFor(draft)}
                onChange={(e) =>
                  setEdits((prev) => ({ ...prev, [draft.id]: e.target.value }))
                }
                rows={4}
                disabled={draft.status === "created"}
              />
              <div className="flex gap-2">
                {draft.status === "proposed" && (
                  <>
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => save(draft)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      disabled={isPending || !hasComposeScope}
                      onClick={() => push(draft.id)}
                    >
                      Push to Gmail as draft
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" disabled={isPending} onClick={() => remove(draft.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
