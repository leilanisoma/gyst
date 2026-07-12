"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function buildBookmarkletHref(appUrl: string): string {
  const body = `
    var url = encodeURIComponent(location.href);
    var title = encodeURIComponent(document.title || "");
    window.open(${JSON.stringify(appUrl)} + "/recruiting/capture?url=" + url + "&title=" + title, "_blank");
  `.replace(/\s+/g, " ");
  return `javascript:(function(){${body}})();`;
}

/**
 * LinkedIn/Handshake have no viable API for personal job discovery (PLAN.md
 * §8), so capture is a bookmarklet rather than a browser extension — no
 * store review, no per-browser manifest to maintain, works anywhere
 * bookmarklets do. Clicking it on a job posting opens /recruiting/capture
 * pre-filled with that page's URL and title.
 */
export function BookmarkletCard() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const href = buildBookmarkletHref(appUrl);

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <h2 className="text-sm font-semibold">
          Save to GYST
          <span className="text-muted-foreground font-normal">
            {" "}
            — capture a posting from LinkedIn, Handshake, or anywhere else
          </span>
        </h2>
        <p className="text-muted-foreground text-sm">
          Drag this to your bookmarks bar, then click it on any job posting:
        </p>
        <a
          href={href}
          onClick={(event) => event.preventDefault()}
          className="border-input bg-muted w-fit cursor-grab rounded-md border px-3 py-1.5 text-sm font-medium select-none active:cursor-grabbing"
        >
          Save to GYST
        </a>
        <Button
          size="sm"
          variant="ghost"
          className="w-fit"
          onClick={() => {
            navigator.clipboard.writeText(href);
            toast.success("Bookmarklet code copied — paste it as a new bookmark's URL.");
          }}
        >
          Copy bookmarklet code instead
        </Button>
      </CardContent>
    </Card>
  );
}
