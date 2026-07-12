"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteDraft, updateDraft } from "@/app/(app)/recruiting/drafts-actions";
import { DRAFT_KIND_LABELS } from "@/lib/recruiting";
import type { DraftRow } from "./types";

const STATUSES: DraftRow["status"][] = ["draft", "approved", "exported"];

export function DraftCard({ draft }: { draft: DraftRow }) {
  const [content, setContent] = useState(draft.content);
  const [status, setStatus] = useState(draft.status);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateDraft(draft.id, {
        content,
        unsupportedClaims: draft.unsupported_claims,
        status,
      });
      if (!result.ok) toast.error(result.error);
      else toast.success("Draft updated.");
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteDraft(draft.id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-2">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{DRAFT_KIND_LABELS[draft.kind]}</Badge>
        <Select
          value={status}
          onValueChange={(value) => value && setStatus(value as DraftRow["status"])}
        >
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {draft.unsupported_claims.length > 0 && (
        <p className="text-destructive text-xs">
          Needs evidence review: {draft.unsupported_claims.join(", ")}
        </p>
      )}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={5}
        className="text-xs"
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" disabled={isPending} onClick={remove}>
          Delete
        </Button>
        <Button size="sm" disabled={isPending} onClick={save}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
