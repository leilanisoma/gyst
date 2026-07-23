"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const REASON_LABELS: Record<string, string> = {
  invalid_state: "The connection attempt expired or was tampered with — try again.",
  connect_failed: "Google rejected the connection — try again.",
  access_denied: "You didn't grant access.",
};

/**
 * `/api/gmail/callback` and `/api/google/callback` redirect back here with
 * `?gmail=connected`/`?google=error&reason=...` — the only feedback the
 * OAuth round trip gives. Nothing was ever reading these params, so a
 * successful or failed reconnect looked identical (silent redirect, no
 * toast) until the integration card's own DB-backed status caught up.
 */
export function OAuthCallbackToast() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const gmailStatus = searchParams.get("gmail");
    const googleStatus = searchParams.get("google");
    const status = gmailStatus ?? googleStatus;
    if (!status) return;

    const provider = gmailStatus ? "Gmail" : "Calendar";
    if (status === "connected") {
      toast.success(`${provider} connected.`);
    } else if (status === "error") {
      const reason = searchParams.get("reason");
      const detail = reason ? REASON_LABELS[reason] ?? reason : "";
      toast.error(`${provider} connection failed.${detail ? ` ${detail}` : ""}`);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("gmail");
    url.searchParams.delete("google");
    url.searchParams.delete("reason");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
    // Only ever meant to run once, against whatever params this navigation
    // landed with — re-running on every searchParams identity change would
    // re-toast after the cleanup replace below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
