"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The journal popup's two views (Phase 9D follow-up, 2026-07-21) — the
 * quick daily ritual (outcomes/check-in) and the full inbox list, toggled
 * in place instead of `Link`-ing to `/inbox`. That used to hand off to
 * `RouteTransition`'s page-pop animation while this dialog was still open,
 * which is what actually caused the "shake" (two pages briefly mounted at
 * once, mid-transition, at the same coordinates) — swapping content inside
 * the already-open dialog has no transition to get wrong, and the close
 * (X) button and open animation are just whatever the dialog already had.
 */
export function JournalPopupBody({
  quickContent,
  fullInboxContent,
}: {
  quickContent: ReactNode;
  fullInboxContent: ReactNode;
}) {
  const [showFullInbox, setShowFullInbox] = useState(false);

  if (showFullInbox) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start"
          onClick={() => setShowFullInbox(false)}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {fullInboxContent}
      </>
    );
  }

  return (
    <>
      {quickContent}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setShowFullInbox(true)}
      >
        View full inbox
      </Button>
    </>
  );
}
