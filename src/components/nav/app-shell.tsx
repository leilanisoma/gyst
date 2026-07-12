import type { ReactNode } from "react";
import type { NotificationItem } from "./notification-bell";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";

export function AppShell({
  email,
  notifications,
  children,
}: {
  email: string | undefined;
  notifications: NotificationItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav email={email} notifications={notifications} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav email={email} notifications={notifications} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
