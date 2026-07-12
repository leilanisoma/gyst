"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExtractedItem } from "@/ai/types";

/**
 * Confirmation UI for AI-extracted candidates (PLAN.md §5 brain-dump flow,
 * step 3). Nothing is saved until the user reviews and confirms — every
 * candidate starts unchecked below the AI's own confidence threshold.
 */
export function ExtractionConfirmDialog({
  open,
  onOpenChange,
  items,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExtractedItem[];
  onConfirm: (accepted: ExtractedItem[]) => void;
  isSubmitting?: boolean;
}) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    items.map((item) => item.confidence >= 0.6),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review extracted items</DialogTitle>
          <DialogDescription>
            Nothing is saved until you confirm. Uncheck anything that
            doesn&apos;t belong.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={checked[index]}
                onCheckedChange={(value) =>
                  setChecked((prev) =>
                    prev.map((c, i) => (i === index ? value === true : c)),
                  )
                }
              />
              <span>
                <span className="font-medium">[{item.type}]</span> {item.text}
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || checked.every((c) => !c)}
            onClick={() =>
              onConfirm(items.filter((_, index) => checked[index]))
            }
          >
            {isSubmitting ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
