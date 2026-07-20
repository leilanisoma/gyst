import { RoomLoading } from "@/components/room/room-loading";
import { ROOMS } from "@/lib/rooms";

export default function Loading() {
  return <RoomLoading room={ROOMS.recruiting.background} />;
}
