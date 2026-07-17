import type { ReactNode } from "react";
import type { NotificationItem } from "./notification-bell";
import { TopBar } from "./top-bar";
import { RouteTransition } from "./route-transition";
import { FloatingChat } from "@/components/chat/floating-chat";

export function AppShell({
  email,
  notifications,
  chatAvailable,
  children,
}: {
  email: string | undefined;
  notifications: NotificationItem[];
  chatAvailable: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar email={email} notifications={notifications} />
      <div className="flex-1">
        <RouteTransition>{children}</RouteTransition>
      </div>
      {chatAvailable && <FloatingChat />}
    </div>
  );
}
