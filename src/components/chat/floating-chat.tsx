"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatShell } from "./chat-shell";
import { EMPTY_CHAT_PANEL_DATA } from "@/lib/chat/panel-data";

/**
 * Global floating entry point into chat (replaces a top-level "Chat" nav
 * tab — the assistant is meant to be reachable from anywhere, not a
 * separate destination). Rendered once in `AppShell` for every
 * authenticated page, gated on AI being configured.
 */
export function FloatingChat() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="icon-lg"
            aria-label="Open chat"
            className="fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg"
          />
        }
      >
        <MessageCircle className="size-6" />
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
