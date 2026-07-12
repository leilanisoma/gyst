import type { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";

export function AppShell({
  email,
  children,
}: {
  email: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav email={email} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
