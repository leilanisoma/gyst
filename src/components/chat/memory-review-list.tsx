"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveMemoryItem,
  confirmMemoryItem,
  deleteMemoryItem,
  exportMemory,
  updateMemoryItemText,
} from "@/app/(app)/chat/memory-actions";

type MemoryItem = {
  id: string;
  kind: string;
  text: string;
  confidence: number | null;
  source: string;
  status: string;
  learned_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Needs review",
  confirmed: "Confirmed",
  archived: "Archived",
};

export function MemoryReviewList({ items }: { items: MemoryItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const pending = items.filter((i) => i.status === "pending");
  const confirmed = items.filter((i) => i.status === "confirmed");
  const archived = items.filter((i) => i.status === "archived");

  function run(
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });
  }

  async function handleExport() {
    const result = await exportMemory();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const blob = new Blob([result.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gyst-memory-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function startEdit(item: MemoryItem) {
    setEditingId(item.id);
    setEditingText(item.text);
  }

  function saveEdit(id: string) {
    run(() => updateMemoryItemText(id, editingText));
    setEditingId(null);
  }

  function renderItem(item: MemoryItem) {
    const isEditing = editingId === item.id;
    return (
      <div
        key={item.id}
        className="flex flex-col gap-1 border-t py-2 text-sm first:border-t-0"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline">{item.kind}</Badge>
          <Badge variant="secondary">
            {STATUS_LABELS[item.status] ?? item.status}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {item.source === "explicit"
              ? "you asked to remember this"
              : "assistant suggested this"}
          </span>
        </div>
        {isEditing ? (
          <Textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            rows={2}
          />
        ) : (
          <p>{item.text}</p>
        )}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => saveEdit(item.id)}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {item.status !== "confirmed" && (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => run(() => confirmMemoryItem(item.id))}
                >
                  Confirm
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                Edit
              </Button>
              {item.status !== "archived" && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => run(() => archiveMemoryItem(item.id))}
                >
                  Archive
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => run(() => deleteMemoryItem(item.id))}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Saved memory
            <span className="text-muted-foreground font-normal">
              {" "}
              — facts, preferences, goals, decisions
            </span>
          </h2>
          <Button size="sm" variant="outline" onClick={handleExport}>
            Export
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing saved yet.</p>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                  Needs review ({pending.length})
                </h3>
                <div className="flex flex-col">{pending.map(renderItem)}</div>
              </div>
            )}
            {confirmed.length > 0 && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                  Confirmed
                </h3>
                <div className="flex flex-col">{confirmed.map(renderItem)}</div>
              </div>
            )}
            {archived.length > 0 && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                  Archived
                </h3>
                <div className="flex flex-col">{archived.map(renderItem)}</div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
