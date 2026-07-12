"use client";

import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";
import { SignOutButton } from "./sign-out-button";

export function SidebarNav({ email }: { email: string | undefined }) {
  return (
    <aside className="border-sidebar-border bg-sidebar hidden w-56 shrink-0 flex-col border-r p-4 md:flex">
      <div className="mb-6 px-3">
        <p className="text-sidebar-foreground text-lg font-semibold tracking-tight">
          gyst
        </p>
        {email && (
          <p className="text-sidebar-foreground/60 truncate text-xs">{email}</p>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <SignOutButton />
    </aside>
  );
}
