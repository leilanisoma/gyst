"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead } from "@/app/(app)/notifications/actions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="border-border bg-popover text-popover-foreground absolute right-0 z-50 mt-2 w-72 rounded-lg border p-2 shadow-md">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="text-muted-foreground text-xs hover:underline disabled:opacity-50"
                disabled={isPending}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground p-2 text-sm">
              No notifications yet.
            </p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "rounded-md p-2 text-sm",
                    !notification.read_at && "bg-muted",
                  )}
                >
                  <p className="font-medium">{notification.title}</p>
                  {notification.body && (
                    <p className="text-muted-foreground text-xs">
                      {notification.body}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
