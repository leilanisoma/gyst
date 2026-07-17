"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adjacentRoomHrefs } from "@/lib/room-sequence";

/**
 * Left/right arrows for the room filmstrip (Garden/Living Room/Nook/Study
 * Desk) — the discoverable, precise counterpart to the drag/swipe gesture
 * in `RouteTransition`. Renders nothing outside the slidable sequence.
 */
export function RoomSlideArrows() {
  const pathname = usePathname();
  const router = useRouter();
  const { prev, next } = adjacentRoomHrefs(pathname);

  if (!prev && !next) return null;

  return (
    <>
      {prev && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Slide to the previous room"
          onClick={() => router.push(prev)}
          className="fixed top-1/2 left-2 z-30 -translate-y-1/2 rounded-full"
        >
          <ChevronLeft className="size-6" />
        </Button>
      )}
      {next && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Slide to the next room"
          onClick={() => router.push(next)}
          className="fixed top-1/2 right-2 z-30 -translate-y-1/2 rounded-full"
        >
          <ChevronRight className="size-6" />
        </Button>
      )}
    </>
  );
}
