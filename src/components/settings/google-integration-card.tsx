"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  disconnectGoogle,
  setFixedCalendarIds,
  syncGoogleCalendarNow,
} from "@/app/(app)/settings/actions";

export type GoogleCalendarOption = { id: string; summary: string };

export function GoogleIntegrationCard({
  status,
  accountEmail,
  lastSyncedAt,
  error,
  calendars,
  initialFixedCalendarIds,
  hasWriteScope,
}: {
  status: "not_connected" | "connected" | "error";
  accountEmail: string | null;
  lastSyncedAt: string | null;
  error: string | null;
  calendars: GoogleCalendarOption[];
  initialFixedCalendarIds: string[];
  hasWriteScope: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [fixedIds, setFixedIds] = useState(new Set(initialFixedCalendarIds));
  const dirty =
    fixedIds.size !== initialFixedCalendarIds.length ||
    initialFixedCalendarIds.some((id) => !fixedIds.has(id));

  function toggleCalendar(id: string) {
    setFixedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function saveFixedCalendars() {
    startTransition(async () => {
      const result = await setFixedCalendarIds(Array.from(fixedIds));
      if (!result.ok) toast.error(result.error);
      else toast.success("Fixed calendars updated.");
    });
  }

  function syncNow() {
    startTransition(async () => {
      const result = await syncGoogleCalendarNow();
      if (!result.ok) toast.error(result.error);
      else
        toast.success(
          `Synced ${result.calendarsSynced} calendar${result.calendarsSynced === 1 ? "" : "s"} — ${result.created} new, ${result.updated} updated.`,
        );
    });
  }

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectGoogle();
      if (!result.ok) toast.error(result.error);
      else toast.success("Google Calendar disconnected.");
    });
  }

  if (status === "not_connected") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Connect Google Calendar to see classes, fencing, and other commitments
          on Today, and to stop tracking your schedule in two places.
        </p>
        <a
          href="/api/google/connect"
          className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex w-fit items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium"
        >
          Connect Google Calendar
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant={status === "error" ? "destructive" : "secondary"}>
          {status === "error" ? "Error" : "Connected"}
        </Badge>
        {accountEmail && (
          <span className="text-muted-foreground text-sm">{accountEmail}</span>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <p className="text-muted-foreground text-sm">
        {lastSyncedAt
          ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
          : "Never synced yet."}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={isPending} onClick={syncNow}>
          Sync now
        </Button>
        <a
          href="/api/google/connect"
          className="border-border bg-background hover:bg-muted inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium"
        >
          Reconnect
        </a>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={disconnect}
        >
          Disconnect
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        <h3 className="text-sm font-medium">Approved block write-back</h3>
        {hasWriteScope ? (
          <p className="text-muted-foreground text-sm">
            Enabled — accepting a suggested time block adds it to a dedicated
            &ldquo;GYST&rdquo; calendar in Google Calendar. Undo removes it
            again without touching anything else.
          </p>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              Off by default. Enabling this grants access only to
              calendars/events this app creates itself — never your other
              calendars.
            </p>
            <a
              href="/api/google/connect?scope=write"
              className="border-border bg-background hover:bg-muted inline-flex w-fit items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium"
            >
              Enable calendar write-back
            </a>
          </>
        )}
      </div>

      {calendars.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <h3 className="text-sm font-medium">Fixed commitment calendars</h3>
          <p className="text-muted-foreground text-sm">
            Events on checked calendars (e.g. class, fencing) block time in the
            daily planner, the same as manually entered recurring schedules.
          </p>
          <ul className="flex flex-col gap-1.5">
            {calendars.map((calendar) => (
              <li key={calendar.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  id={`cal-${calendar.id}`}
                  checked={fixedIds.has(calendar.id)}
                  onCheckedChange={() => toggleCalendar(calendar.id)}
                />
                <label htmlFor={`cal-${calendar.id}`} className="truncate">
                  {calendar.summary}
                </label>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending || !dirty}
            onClick={saveFixedCalendars}
            className="w-fit"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
