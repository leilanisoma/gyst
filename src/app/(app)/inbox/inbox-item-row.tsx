"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExtractionConfirmDialog } from "@/components/ai/extraction-confirm-dialog";
import type { ExtractedItem } from "@/ai/types";
import {
  commitExtractedItems,
  convertInboxItem,
  extractInboxItem,
  type ConvertTarget,
} from "./actions";

type InboxItem = {
  id: string;
  raw_text: string;
  created_at: string;
};

const LABELS: Record<ConvertTarget, string> = {
  task: "Convert to task",
  goal: "Convert to goal",
  note: "Mark as note",
};

export function InboxItemRow({
  item,
  aiExtractionEnabled,
}: {
  item: InboxItem;
  aiExtractionEnabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<ExtractedItem[] | null>(null);

  function convert(target: ConvertTarget) {
    startTransition(async () => {
      const result = await convertInboxItem(item.id, target);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(
          target === "note" ? "Marked as note" : `Converted to ${target}`,
        );
      }
    });
  }

  function runExtraction() {
    startTransition(async () => {
      const result = await extractInboxItem(item.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCandidates(result.items);
    });
  }

  function confirmExtraction(accepted: ExtractedItem[]) {
    startTransition(async () => {
      const result = await commitExtractedItems(item.id, accepted);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCandidates(null);
      toast.success("Saved");
    });
  }

  return (
    <li className="border-border bg-card flex items-start justify-between gap-2 rounded-lg border p-3 text-sm">
      <div>
        <p className="whitespace-pre-wrap">{item.raw_text}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {new Date(item.created_at).toLocaleString()}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              aria-label="Convert inbox item"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(LABELS) as ConvertTarget[]).map((target) => (
            <DropdownMenuItem key={target} onClick={() => convert(target)}>
              {LABELS[target]}
            </DropdownMenuItem>
          ))}
          {aiExtractionEnabled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={runExtraction}>
                <Sparkles className="size-4" />
                Extract with AI
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {candidates && (
        <ExtractionConfirmDialog
          open
          onOpenChange={(open) => !open && setCandidates(null)}
          items={candidates}
          onConfirm={confirmExtraction}
          isSubmitting={isPending}
        />
      )}
    </li>
  );
}
