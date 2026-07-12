import webpush from "web-push";
import { getWebPushEnv } from "./env";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  try {
    const env = getWebPushEnv();
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    configured = true;
    return true;
  } catch {
    // VAPID keys aren't configured yet — push is opt-in infrastructure, so
    // callers should treat "not configured" the same as "send failed."
    return false;
  }
}

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = { title: string; body?: string; link?: string };

/** `gone: true` means the subscription is no longer valid and should be deleted. */
export async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<{ ok: boolean; gone: boolean }> {
  if (!ensureConfigured()) return { ok: false, gone: false };

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true, gone: false };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    return { ok: false, gone: statusCode === 404 || statusCode === 410 };
  }
}
