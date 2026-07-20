"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CompanionBlob } from "@/components/companion/companion-blob";
import type { CompanionState } from "@/lib/companion";
import { cn } from "@/lib/utils";
import { ChatShell } from "./chat-shell";
import { EMPTY_CHAT_PANEL_DATA } from "@/lib/chat/panel-data";

/**
 * Global chat entry point (Phase 9D) — the companion blob itself, not a
 * plain icon button. Replaces `FloatingChat`; rendered once in `AppShell`
 * for every authenticated page, gated on AI being configured. `state`
 * comes from the `(app)` layout so it reflects real activity everywhere,
 * not just Today where the companion originated (Phase 9C).
 *
 * On the Living Room hub (`/`) it sits on the couch instead of its usual
 * fixed bottom-right spot (2026-07-20) — coordinates picked by eye against
 * the couch in the Living Room art, left of the docked side panel so the
 * two don't overlap.
 */
export function CompanionChatLauncher({ state }: { state: CompanionState }) {
  const pathname = usePathname();
  const onCouch = pathname === "/";

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            aria-label="Open chat"
            className={cn(
              "bg-card/90 shadow-cozy fixed z-40 h-auto w-auto flex-col gap-1 rounded-2xl p-2 backdrop-blur",
              onCouch
                ? "top-[60%] left-[36%] -translate-x-1/2 -translate-y-1/2"
                : "right-6 bottom-6",
            )}
          />
        }
      >
        <CompanionBlob state={state} size={56} />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b py-3">
          <SheetTitle>Chat</SheetTitle>
        </SheetHeader>
        <ChatShell mode="floating" initial={EMPTY_CHAT_PANEL_DATA} />
      </SheetContent>
    </Sheet>
  );
}
