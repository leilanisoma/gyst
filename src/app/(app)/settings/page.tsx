import { RoomBackground } from "@/components/room/room-background";
import { RoomContentPanel } from "@/components/room/room-content-panel";
import { SettingsContent } from "./settings-content";

export default function SettingsPage() {
  return (
    <main className="relative isolate flex h-screen flex-col items-center justify-center p-4">
      <RoomBackground room="living-room" />
      <RoomContentPanel>
        <SettingsContent />
      </RoomContentPanel>
    </main>
  );
}
