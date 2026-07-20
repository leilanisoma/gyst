import { RoomBackground } from "@/components/room/room-background";
import { RoomContentPanel } from "@/components/room/room-content-panel";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-loading fallback (Next.js `loading.tsx`, shown instantly while a
 * room page's async Server Component fetches its data) — the room's own
 * background art plus a pulsing glass skeleton, instead of the plain flat
 * `--background` color the generic root fallback used to show. That flat
 * color reads as a jarring "yellow screen" flash between rooms now that
 * `--background` is a warm cream/yellow for the day period (2026-07-20)
 * — this makes the room itself appear instantly, with only the content
 * inside it visibly loading.
 */
export function RoomLoading({ room }: { room: string }) {
  return (
    <main className="relative isolate flex h-screen flex-col items-center justify-center p-4">
      <RoomBackground room={room} />
      <RoomContentPanel>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </RoomContentPanel>
    </main>
  );
}
