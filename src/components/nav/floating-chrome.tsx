import Link from "next/link";
import { NotificationBell, type NotificationItem } from "./notification-bell";
import { SignOutButton } from "./sign-out-button";

/**
 * Replaces `TopBar` (Phase 9D, 2026-07-20) — the same home link/bell/email/
 * sign-out, but as small floating pills over the room art instead of a
 * header strip, so pages get the full viewport instead of losing a bar's
 * worth of height to chrome.
 */
export function FloatingChrome({
  email,
  notifications,
}: {
  email: string | undefined;
  notifications: NotificationItem[];
}) {
  return (
    <>
      <Link
        href="/"
        className="bg-card/90 shadow-cozy fixed top-4 left-4 z-40 rounded-2xl px-3 py-2 text-lg font-semibold tracking-tight backdrop-blur"
      >
        gyst
      </Link>
      <div className="bg-card/90 shadow-cozy fixed top-4 right-4 z-40 flex items-center gap-2 rounded-2xl px-2 py-1 backdrop-blur">
        {email && (
          <span className="text-muted-foreground hidden truncate text-xs sm:inline">
            {email}
          </span>
        )}
        <NotificationBell notifications={notifications} />
        <SignOutButton />
      </div>
    </>
  );
}
