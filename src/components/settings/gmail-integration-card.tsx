"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  disconnectGmail,
  purgeGmailData,
  setGmailRetentionDays,
  setGmailSearchQuery,
  syncGmailNow,
} from "@/app/(app)/settings/actions";

export function GmailIntegrationCard({
  status,
  accountEmail,
  lastSyncedAt,
  error,
  hasComposeScope,
  initialSearchQuery,
  initialRetentionDays,
}: {
  status: "not_connected" | "connected" | "error";
  accountEmail: string | null;
  lastSyncedAt: string | null;
  error: string | null;
  hasComposeScope: boolean;
  initialSearchQuery: string;
  initialRetentionDays: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [retentionDays, setRetentionDays] = useState(String(initialRetentionDays));

  function syncNow() {
    startTransition(async () => {
      const result = await syncGmailNow();
      if (!result.ok) toast.error(result.error);
      else
        toast.success(
          `Scanned ${result.messagesScanned} message${result.messagesScanned === 1 ? "" : "s"} — ${result.itemsCreated} new item${result.itemsCreated === 1 ? "" : "s"} to review.`,
        );
    });
  }

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectGmail();
      if (!result.ok) toast.error(result.error);
      else toast.success("Gmail disconnected.");
    });
  }

  function saveSearchQuery() {
    startTransition(async () => {
      const result = await setGmailSearchQuery(searchQuery);
      if (!result.ok) toast.error(result.error);
      else toast.success("Gmail search scope updated.");
    });
  }

  function saveRetention() {
    const days = Number(retentionDays);
    startTransition(async () => {
      const result = await setGmailRetentionDays(days);
      if (!result.ok) toast.error(result.error);
      else toast.success("Retention window updated.");
    });
  }

  function purgeAll() {
    if (
      !window.confirm(
        "Delete every stored Gmail excerpt, draft, and processed-message record? This can't be undone.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await purgeGmailData();
      if (!result.ok) toast.error(result.error);
      else toast.success("All stored Gmail data deleted.");
    });
  }

  if (status === "not_connected") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Connect Gmail to surface interview dates, application
          confirmations, deadlines, and requested actions from your inbox.
          This is expected to be a different Google account than the one
          connected for Calendar.
        </p>
        <a
          href="/api/gmail/connect"
          className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex w-fit items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium"
        >
          Connect Gmail
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant={status === "error" ? "destructive" : "secondary"}>
          {status === "error" ? "Error" : "Connected"}
        </Badge>
        {accountEmail && (
          <span className="text-muted-foreground text-sm">{accountEmail}</span>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <p className="text-muted-foreground text-sm">
        {lastSyncedAt
          ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
          : "Never synced yet."}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={isPending} onClick={syncNow}>
          Sync now
        </Button>
        <a
          href="/api/gmail/connect"
          className="border-border bg-background hover:bg-muted inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium"
        >
          Reconnect
        </a>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={disconnect}
        >
          Disconnect
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        <h3 className="text-sm font-medium">Search scope</h3>
        <p className="text-muted-foreground text-sm">
          By default, sync reads your whole mailbox except Promotions,
          Social, Spam, and Trash. Optionally narrow that to a Gmail search
          query or label — e.g. <code>label:job-search</code>.
        </p>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Default: whole mailbox, minus promotions/social"
            className="max-w-56"
          />
          <Button size="sm" variant="outline" disabled={isPending} onClick={saveSearchQuery}>
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        <h3 className="text-sm font-medium">Draft-only replies</h3>
        {hasComposeScope ? (
          <p className="text-muted-foreground text-sm">
            Enabled — GYST can create draft replies in your real Gmail
            drafts folder. It never sends anything; you still have to open
            Gmail and click Send yourself.
          </p>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              Off by default. Enabling this lets GYST create (not send)
              draft replies for review queue items.
            </p>
            <a
              href="/api/gmail/connect?scope=compose"
              className="border-border bg-background hover:bg-muted inline-flex w-fit items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium"
            >
              Enable draft-only replies
            </a>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        <h3 className="text-sm font-medium">Retention</h3>
        <p className="text-muted-foreground text-sm">
          Extracted excerpts are deleted automatically after this many days.
        </p>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            max={365}
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            className="max-w-24"
          />
          <Button size="sm" variant="outline" disabled={isPending} onClick={saveRetention}>
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        <h3 className="text-sm font-medium">Delete stored Gmail data</h3>
        <p className="text-muted-foreground text-sm">
          Immediately deletes every stored excerpt, draft, and
          processed-message record for this account (not the connection
          itself).
        </p>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={purgeAll}
          className="w-fit"
        >
          Delete all stored Gmail data
        </Button>
      </div>
    </div>
  );
}
