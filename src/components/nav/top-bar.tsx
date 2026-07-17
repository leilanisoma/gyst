import Link from "next/link";
import { NotificationBell, type NotificationItem } from "./notification-bell";
import { SignOutButton } from "./sign-out-button";

/**
 * The only persistent chrome left once room doorways/ambient objects
 * replace the sidebar as primary navigation (Phase 9D). "gyst" links back
 * to the Living Room hub — the way home from any room, since there's no
 * other cross-page nav anymore.
 */
export function TopBar({
  email,
  notifications,
}: {
  email: string | undefined;
  notifications: NotificationItem[];
}) {
  return (
    <header className="border-border bg-background flex items-center justify-between border-b p-3">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        gyst
      </Link>
      <div className="flex items-center gap-2">
        {email && (
          <span className="text-muted-foreground hidden truncate text-xs sm:inline">
            {email}
          </span>
        )}
        <NotificationBell notifications={notifications} />
        <SignOutButton />
      </div>
    </header>
  );
}
