"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  confirmSyllabusItem,
  dismissSyllabusItem,
} from "@/app/(app)/school/syllabus-extraction-actions";

export type SyllabusItemRow = {
  id: string;
  title: string;
  description: string | null;
  kind: "policy" | "major_date" | "other";
  date: string | null;
  sourcePage: number | null;
  confidence: number | null;
  courseTitle: string;
};

const KIND_LABELS: Record<SyllabusItemRow["kind"], string> = {
  policy: "Policy",
  major_date: "Major date",
  other: "Other",
};

/** PLAN.md §15 task 6.6 review queue — mirrors AssessmentReviewQueue's confirm/dismiss shape. */
export function SyllabusItemsReviewQueue({ items }: { items: SyllabusItemRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) return null;

  function confirm(id: string) {
    startTransition(async () => {
      const result = await confirmSyllabusItem(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Confirmed.");
    });
  }

  function dismiss(id: string) {
    startTransition(async () => {
      const result = await dismissSyllabusItem(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Dismissed.");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className="text-sm font-semibold">
          Syllabus items to review
          <span className="text-muted-foreground font-normal"> — extracted, not yet confirmed</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex flex-col">
                <span>
                  {item.title} <span className="text-muted-foreground">— {item.courseTitle}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  {KIND_LABELS[item.kind]}
                  {item.date ? ` · ${new Date(item.date).toLocaleDateString()}` : ""}
                  {item.sourcePage != null ? ` · page ${item.sourcePage}` : ""}
                  {item.confidence != null ? ` · ${Math.round(item.confidence * 100)}% confident` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{KIND_LABELS[item.kind]}</Badge>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => dismiss(item.id)}>
                  Dismiss
                </Button>
                <Button size="sm" disabled={isPending} onClick={() => confirm(item.id)}>
                  Confirm
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
