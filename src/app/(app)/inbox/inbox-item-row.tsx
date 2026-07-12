"use client";

import { useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { convertInboxItem, type ConvertTarget } from "./actions";

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

export function InboxItemRow({ item }: { item: InboxItem }) {
  const [isPending, startTransition] = useTransition();

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
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
