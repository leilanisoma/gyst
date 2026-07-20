"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Greeting } from "@/components/today/greeting";
import { RoomPopupContent } from "@/components/room/room-popup-content";

/**
 * The greeting bubble on the Living Room hub (Phase 9D, 2026-07-20) — same
 * floating-pill/backdrop-blur treatment as `FloatingChrome`'s pills, and
 * `font-heading` like every other title in the app. Clicking it opens a
 * popup housing the day/week planning content (timeline, due-today,
 * time-block suggestions, weekly goals, overwhelm mode) — everything that
 * used to sit in the hub's docked side panel, minus capture/check-in/
 * outcomes, which live in `JournalPopup` instead.
 */
export function PlannerPopup({
  name,
  fallbackGreeting,
  children,
}: {
  name: string;
  fallbackGreeting: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label="Open today and this week"
            className="bg-card/90 shadow-cozy font-heading rounded-2xl px-4 py-2 text-2xl font-semibold tracking-tight backdrop-blur"
          />
        }
      >
        <Greeting name={name} fallbackPhrase={fallbackGreeting} />
      </DialogTrigger>
      <RoomPopupContent title="Today & this week">{children}</RoomPopupContent>
    </Dialog>
  );
}
