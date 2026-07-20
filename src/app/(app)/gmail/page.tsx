import { RoomBackground } from "@/components/room/room-background";
import { RoomContentPanel } from "@/components/room/room-content-panel";
import { GmailContent } from "./gmail-content";

export default function GmailPage() {
  return (
    <main className="relative isolate flex h-screen flex-col items-center justify-center p-4">
      <RoomBackground room="living-room" />
      <RoomContentPanel>
        <GmailContent />
      </RoomContentPanel>
    </main>
  );
}
