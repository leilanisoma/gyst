"use client";

import { useRouter } from "next/navigation";

/**
 * A click-outside-to-leave backdrop for full-page room routes (e.g.
 * `/inbox`) that aren't opened as an `AmbientObjectPopup` `Dialog` — those
 * already close on backdrop click for free. Sits behind `RoomContentPanel`
 * (`z-10`) so clicks on the panel itself never reach it; only the room art
 * visible around the panel's edges is clickable.
 */
export function RoomExitOverlay({ href }: { href: string }) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="Close"
      className="absolute inset-0 z-0"
      onClick={() => router.push(href)}
    />
  );
}
