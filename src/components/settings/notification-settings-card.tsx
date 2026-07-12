"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  subscribeToPush,
  unsubscribeFromPush,
  updateQuietHours,
} from "@/app/(app)/notifications/actions";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64Safe);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function NotificationSettingsCard({
  quietHoursStart,
  quietHoursEnd,
  pushSubscribed,
}: {
  quietHoursStart: string;
  quietHoursEnd: string;
  pushSubscribed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [start, setStart] = useState(quietHoursStart);
  const [end, setEnd] = useState(quietHoursEnd);

  function saveQuietHours() {
    startTransition(async () => {
      const result = await updateQuietHours({
        quietHoursStart: start,
        quietHoursEnd: end,
      });
      if (!result.ok) toast.error(result.error);
      else toast.success("Quiet hours updated.");
    });
  }

  function enablePush() {
    startTransition(async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.error("Push notifications aren't supported in this browser.");
        return;
      }
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.error("Push isn't configured on the server yet.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was denied.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as BufferSource,
      });
      const key = subscription.getKey("p256dh");
      const authSecret = subscription.getKey("auth");
      if (!key || !authSecret) {
        toast.error("Couldn't read push subscription keys.");
        return;
      }

      const result = await subscribeToPush({
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
        auth: btoa(String.fromCharCode(...new Uint8Array(authSecret))),
      });
      if (!result.ok) toast.error(result.error);
      else toast.success("Push notifications enabled.");
    });
  }

  function disablePush() {
    startTransition(async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeFromPush(subscription.endpoint);
      }
      toast.success("Push notifications disabled.");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Quiet hours</Label>
        <p className="text-muted-foreground text-sm">
          No push notifications during this window, even for connector errors.
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="h-8 w-28"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className="h-8 w-28"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={saveQuietHours}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        {pushSubscribed ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={disablePush}
            className="w-fit"
          >
            Disable push notifications
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={isPending}
            onClick={enablePush}
            className="w-fit"
          >
            Enable push notifications
          </Button>
        )}
      </div>
    </div>
  );
}
