"use client";

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
import { ChatShell } from "./chat-shell";
import { EMPTY_CHAT_PANEL_DATA } from "@/lib/chat/panel-data";

/**
 * Global chat entry point (Phase 9D) — the companion blob itself, not a
 * plain icon button. Replaces `FloatingChat`; rendered once in `AppShell`
 * for every authenticated page, gated on AI being configured. `state`
 * comes from the `(app)` layout so it reflects real activity everywhere,
 * not just Today where the companion originated (Phase 9C).
 */
export function CompanionChatLauncher({ state }: { state: CompanionState }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            aria-label="Open chat"
            className="bg-card/90 shadow-cozy fixed right-6 bottom-6 z-40 h-auto w-auto flex-col gap-1 rounded-2xl p-2 backdrop-blur"
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
