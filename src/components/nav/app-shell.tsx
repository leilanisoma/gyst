import type { ReactNode } from "react";
import type { NotificationItem } from "./notification-bell";
import { FloatingChrome } from "./floating-chrome";
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
    <div className="min-h-screen">
      <FloatingChrome email={email} notifications={notifications} />
      <RoomSlideArrows />
      <div className="overflow-x-hidden">
        <RouteTransition>{children}</RouteTransition>
      </div>
      {chatAvailable && <CompanionChatLauncher state={companionState} />}
    </div>
  );
}
