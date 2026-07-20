import type { ReactNode } from "react";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Shared `DialogContent` shape for the hub's in-scene popups (Phase 9D,
 * 2026-07-20) — `JournalPopup` and `PlannerPopup` both use this so they
 * read as the same kind of popup rather than two one-off layouts.
 */
export function RoomPopupContent({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
      <DialogTitle>{title}</DialogTitle>
      <div className="flex flex-col gap-5">{children}</div>
    </DialogContent>
  );
}
