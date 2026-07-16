import type { ReactNode } from "react";
import type { NotificationItem } from "./notification-bell";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
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
    <div className="flex min-h-screen">
      <SidebarNav email={email} notifications={notifications} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav email={email} notifications={notifications} />
        <div className="flex-1">{children}</div>
      </div>
      {chatAvailable && <FloatingChat />}
    </div>
  );
}
