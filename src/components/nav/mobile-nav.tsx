"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";
import { SignOutButton } from "./sign-out-button";

export function MobileNav({ email }: { email: string | undefined }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border bg-background flex items-center justify-between border-b p-3 md:hidden">
      <p className="text-lg font-semibold tracking-tight">gyst</p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
            />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="flex w-64 flex-col p-4">
          <SheetHeader>
            <SheetTitle>gyst</SheetTitle>
            {email && (
              <p className="text-muted-foreground truncate text-xs">{email}</p>
            )}
          </SheetHeader>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>
          <SignOutButton />
        </SheetContent>
      </Sheet>
    </header>
  );
}
