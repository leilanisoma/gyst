"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { updateApplicationDetails } from "@/app/(app)/recruiting/actions";
import { DraftForm } from "./draft-form";
import { DraftCard } from "./draft-card";
import type { ApplicationWithOpportunity } from "./types";

export function ApplicationDetailSheet({
  application,
  open,
  onOpenChange,
}: {
  application: ApplicationWithOpportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [notes, setNotes] = useState(application.notes ?? "");
  const [prepNotes, setPrepNotes] = useState(application.prep_notes ?? "");
  const [nextAction, setNextAction] = useState(application.next_action ?? "");
  const [nextActionDate, setNextActionDate] = useState(
    application.next_action_date ? application.next_action_date.slice(0, 10) : "",
  );
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateApplicationDetails(application.id, {
        notes: notes.trim() || null,
        prepNotes: prepNotes.trim() || null,
        nextAction: nextAction.trim() || null,
        nextActionDate: nextActionDate ? new Date(nextActionDate).toISOString() : null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-96 flex-col gap-4 p-4">
        <SheetHeader>
          <SheetTitle>{application.opportunity?.title ?? "Application"}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="app-next-action">Next action</Label>
              <Input
                id="app-next-action"
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                placeholder="Follow up with recruiter"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="app-next-action-date">Follow up by</Label>
              <Input
                id="app-next-action-date"
                type="date"
                value={nextActionDate}
                onChange={(event) => setNextActionDate(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app-notes">Notes</Label>
            <Textarea
              id="app-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app-prep-notes">
              Prep notes (role/company-specific)
            </Label>
            <Textarea
              id="app-prep-notes"
              value={prepNotes}
              onChange={(event) => setPrepNotes(event.target.value)}
              rows={4}
              placeholder="Talking points, questions to ask, things to review before the interview…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Drafts</Label>
              <DraftForm applicationId={application.id} />
            </div>
            {application.drafts.length === 0 ? (
              <p className="text-muted-foreground text-xs">No drafts yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {application.drafts.map((draft) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </div>
        </div>
        <SheetFooter>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
