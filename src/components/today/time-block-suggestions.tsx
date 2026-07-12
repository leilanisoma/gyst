"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateTimeBlockSuggestions,
  updateTimeBlockSuggestionStatus,
  updateTimeBlockSuggestionTime,
} from "@/app/(app)/actions";
import type { TimeBlockSuggestion } from "@/lib/time-block-suggestions";

function toTimeInputValue(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function withTime(iso: string, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(iso);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function SuggestionRow({ suggestion }: { suggestion: TimeBlockSuggestion }) {
  const [editing, setEditing] = useState(false);
  const [startTime, setStartTime] = useState(
    toTimeInputValue(suggestion.start_at),
  );
  const [endTime, setEndTime] = useState(toTimeInputValue(suggestion.end_at));
  const [isPending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      const result = await updateTimeBlockSuggestionStatus(
        suggestion.id,
        "accepted",
      );
      if (!result.ok) toast.error(result.error);
    });
  }

  function dismiss() {
    startTransition(async () => {
      const result = await updateTimeBlockSuggestionStatus(
        suggestion.id,
        "dismissed",
      );
      if (!result.ok) toast.error(result.error);
    });
  }

  function saveTime() {
    startTransition(async () => {
      const result = await updateTimeBlockSuggestionTime(
        suggestion.id,
        withTime(suggestion.start_at, startTime),
        withTime(suggestion.end_at, endTime),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <li className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {suggestion.tasks?.title ?? "Untitled task"}
          </p>
          {editing ? (
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="h-7 w-28"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="h-7 w-28"
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              {new Date(suggestion.start_at).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
              {" – "}
              {new Date(suggestion.end_at).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
              {suggestion.explanation ? ` · ${suggestion.explanation}` : ""}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {suggestion.tasks?.area && (
            <Badge variant="secondary">{suggestion.tasks.area}</Badge>
          )}
          {suggestion.status === "accepted" && <Badge>Accepted</Badge>}
        </div>
      </div>
      <div className="flex gap-2">
        {editing ? (
          <Button size="sm" onClick={saveTime} disabled={isPending}>
            Save time
          </Button>
        ) : (
          <>
            {suggestion.status === "proposed" && (
              <Button size="sm" onClick={accept} disabled={isPending}>
                Accept
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={isPending}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              disabled={isPending}
            >
              Dismiss
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export function TimeBlockSuggestions({
  suggestions,
}: {
  suggestions: TimeBlockSuggestion[];
}) {
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const result = await generateTimeBlockSuggestions();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.placed > 0
          ? `Suggested ${result.placed} time block${result.placed === 1 ? "" : "s"}.`
          : "No time blocks fit today — try adjusting your check-in capacity.",
      );
    });
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Suggested time blocks</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={refresh}
          disabled={isPending}
        >
          {isPending ? "Thinking…" : "Refresh suggestions"}
        </Button>
      </div>
      {suggestions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No suggestions yet — check in above, then refresh.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <SuggestionRow key={suggestion.id} suggestion={suggestion} />
          ))}
        </ul>
      )}
    </section>
  );
}
