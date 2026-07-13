"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  acceptMilestoneSuggestion,
  dismissMilestoneSuggestion,
} from "@/app/(app)/school/milestone-actions";

export type MilestoneSuggestionRow = {
  id: string;
  title: string;
  due_date: string;
};

/** PLAN.md §15 task 6.7 — proposed prep checkpoints, accept creates a real task. */
export function MilestoneSuggestionsQueue({ suggestions }: { suggestions: MilestoneSuggestionRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (suggestions.length === 0) return null;

  function accept(id: string) {
    startTransition(async () => {
      const result = await acceptMilestoneSuggestion(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Added to your tasks.");
    });
  }

  function dismiss(id: string) {
    startTransition(async () => {
      const result = await dismissMilestoneSuggestion(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Dismissed.");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className="text-sm font-semibold">
          Suggested milestones
          <span className="text-muted-foreground font-normal"> — prep checkpoints for major work</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex flex-col">
                <span>{suggestion.title}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(suggestion.due_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => dismiss(suggestion.id)}>
                  Dismiss
                </Button>
                <Button size="sm" disabled={isPending} onClick={() => accept(suggestion.id)}>
                  Add to tasks
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
