"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { AmbientObject } from "@/components/room/ambient-object";
import { RoomPopupContent } from "@/components/room/room-popup-content";

/**
 * An ambient object on the Living Room hub that opens its content as a
 * popup directly on the scene (base-ui `Dialog` already ships a zoom+fade
 * in/out transition) instead of navigating away — mailbox/journal/
 * thermostat all use this now (2026-07-20; mailbox and thermostat used to
 * navigate to `/gmail` and `/settings`, but Ishani wanted the same
 * open-in-place feel everywhere). `children` is server-rendered content
 * the Today page already fetched or rendered (`GmailContent`,
 * `SettingsContent`, or the journal's own capture/check-in/outcomes) — no
 * separate data-fetching in this component.
 */
export function AmbientObjectPopup({
  id,
  label,
  title,
  image,
  accent,
  className,
  children,
}: {
  id: string;
  label: string;
  title: string;
  image: string;
  accent: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <AmbientObject
        id={id}
        onClick={() => setOpen(true)}
        label={label}
        image={image}
        accent={accent}
        className={className}
      />
      <RoomPopupContent title={title}>{children}</RoomPopupContent>
    </Dialog>
  );
}
