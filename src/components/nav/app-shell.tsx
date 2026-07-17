import type { ReactNode } from "react";
import type { NotificationItem } from "./notification-bell";
import { TopBar } from "./top-bar";
import { RouteTransition } from "./route-transition";
import { CompanionChatLauncher } from "@/components/chat/companion-chat-launcher";
import { RoomSlideArrows } from "@/components/room/room-slide-arrows";
import type { CompanionState } from "@/lib/companion";

export function AppShell({
  email,
  notifications,
  chatAvailable,
  companionState,
  children,
}: {
  email: string | undefined;
  notifications: NotificationItem[];
  chatAvailable: boolean;
  companionState: CompanionState;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar email={email} notifications={notifications} />
      <RoomSlideArrows />
      <div className="flex-1 overflow-x-hidden">
        <RouteTransition>{children}</RouteTransition>
      </div>
      {chatAvailable && <CompanionChatLauncher state={companionState} />}
    </div>
  );
}
