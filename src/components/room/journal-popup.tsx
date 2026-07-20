"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { AmbientObject } from "@/components/room/ambient-object";
import { RoomPopupContent } from "@/components/room/room-popup-content";

/**
 * The journal object on the Living Room hub (Phase 9D, 2026-07-20) — opens
 * its content as a popup directly on the scene (base-ui `Dialog` already
 * ships a zoom+fade in/out transition) instead of navigating to `/inbox`.
 * `children` is server-rendered content the Today page already fetched
 * (capture, check-in, top outcomes, timeline, tasks, goals) — no separate
 * data-fetching here.
 */
export function JournalPopup({
  image,
  accent,
  className,
  children,
}: {
  image: string;
  accent: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <AmbientObject
        id="journal"
        onClick={() => setOpen(true)}
        label="Journal"
        image={image}
        accent={accent}
        className={className}
      />
      <RoomPopupContent title="Journal">{children}</RoomPopupContent>
    </Dialog>
  );
}
