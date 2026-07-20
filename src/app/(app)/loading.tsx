import { RoomLoading } from "@/components/room/room-loading";

/**
 * Fallback for the Living Room hub and everything that reuses its
 * background — Gmail/Inbox/Settings, and any other `(app)` route without
 * its own more specific `loading.tsx` (Wellness/School/Recruiting have one
 * each, since they use their own room art).
 */
export default function Loading() {
  return <RoomLoading room="living-room" />;
}
