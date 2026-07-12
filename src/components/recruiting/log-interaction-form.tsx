"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logInteraction } from "@/app/(app)/recruiting/contacts-actions";
import { INTERACTION_KINDS, type InteractionKind } from "@/lib/recruiting";

export function LogInteractionForm({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<InteractionKind>("other");
  const [summary, setSummary] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [followUpAt, setFollowUpAt] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setKind("other");
    setSummary("");
    setOccurredAt(new Date().toISOString().slice(0, 10));
    setFollowUpAt("");
  }

  function save() {
    startTransition(async () => {
      const result = await logInteraction(contactId, {
        kind,
        summary,
        occurredAt: new Date(occurredAt).toISOString(),
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        applicationId: null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Interaction logged.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        Log interaction
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log interaction</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Kind</Label>
            <Select
              value={kind}
              onValueChange={(value) => value && setKind(value as InteractionKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_KINDS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="interaction-summary">Summary</Label>
            <Textarea
              id="interaction-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="interaction-date">Date</Label>
              <Input
                id="interaction-date"
                type="date"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="interaction-followup">Follow up by (optional)</Label>
              <Input
                id="interaction-followup"
                type="date"
                value={followUpAt}
                onChange={(event) => setFollowUpAt(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending || !summary.trim()}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
