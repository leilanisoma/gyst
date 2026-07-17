/**
 * The horizontal room filmstrip (2026-07-17 direction): Garden (Wellness),
 * the Living Room hub, the Nook (School), and the Study Desk (Recruiting)
 * sit side by side and are reached by sliding left/right, not by a
 * zoom-into-doorway transition — that's still how Gmail/Inbox/Settings
 * work as small objects inside the Living Room, unaffected by this.
 */
export const ROOM_SEQUENCE = ["/wellness", "/", "/school", "/recruiting"] as const;

export type RoomSequenceHref = (typeof ROOM_SEQUENCE)[number];

/** -1 when `pathname` isn't part of the slidable sequence. */
export function roomSequenceIndex(pathname: string): number {
  return ROOM_SEQUENCE.indexOf(pathname as RoomSequenceHref);
}

/** Neighboring hrefs in the sequence, or `null` at an end or off-sequence. */
export function adjacentRoomHrefs(pathname: string): {
  prev: RoomSequenceHref | null;
  next: RoomSequenceHref | null;
} {
  const index = roomSequenceIndex(pathname);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? ROOM_SEQUENCE[index - 1] : null,
    next: index < ROOM_SEQUENCE.length - 1 ? ROOM_SEQUENCE[index + 1] : null,
  };
}

/**
 * Slide direction from `fromPathname` to `toPathname`: 1 (sliding to a
 * later room, content enters from the right), -1 (earlier room, enters
 * from the left), or 0 when either side isn't in the sequence (or they're
 * the same) — callers should fall back to a plain fade in that case.
 */
export function slideDirection(fromPathname: string, toPathname: string): number {
  const from = roomSequenceIndex(fromPathname);
  const to = roomSequenceIndex(toPathname);
  if (from === -1 || to === -1 || from === to) return 0;
  return to > from ? 1 : -1;
}
