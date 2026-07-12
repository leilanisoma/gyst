"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  createDraft,
  listDraftDocumentOptions,
  type DraftDocumentOption,
} from "@/app/(app)/recruiting/drafts-actions";
import { isAIExtractionEnabled } from "@/ai";
import { DRAFT_KINDS, DRAFT_KIND_LABELS, type DraftKind } from "@/lib/recruiting";

export function DraftForm({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DraftKind>("cover_letter");
  const [content, setContent] = useState("");
  const [resumeDocumentId, setResumeDocumentId] = useState<string>("");
  const [evidenceIds, setEvidenceIds] = useState<Set<string>>(new Set());
  const [unsupportedClaims, setUnsupportedClaims] = useState("");
  const [documents, setDocuments] = useState<DraftDocumentOption[]>([]);
  const [isPending, startTransition] = useTransition();
  const aiEnabled = isAIExtractionEnabled();

  useEffect(() => {
    if (open) {
      void listDraftDocumentOptions().then(setDocuments);
    }
  }, [open]);

  function reset() {
    setKind("cover_letter");
    setContent("");
    setResumeDocumentId("");
    setEvidenceIds(new Set());
    setUnsupportedClaims("");
  }

  function toggleEvidence(id: string) {
    setEvidenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await createDraft(applicationId, {
        kind,
        content,
        resumeDocumentId: resumeDocumentId || null,
        evidenceDocumentIds: Array.from(evidenceIds),
        unsupportedClaims: unsupportedClaims
          .split(",")
          .map((claim) => claim.trim())
          .filter(Boolean),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Draft saved.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        New draft
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New draft</DialogTitle>
        </DialogHeader>
        {!aiEnabled && (
          <p className="text-muted-foreground text-xs">
            AI-assisted drafting isn&apos;t available yet — no provider is
            configured. Write it manually and link the evidence you&apos;re
            relying on below.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Kind</Label>
            <Select
              value={kind}
              onValueChange={(value) => value && setKind(value as DraftKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRAFT_KINDS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {DRAFT_KIND_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="draft-content">Content</Label>
            <Textarea
              id="draft-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={8}
            />
          </div>
          {documents.length > 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Resume version used</Label>
                <Select
                  value={resumeDocumentId}
                  onValueChange={(value) => setResumeDocumentId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None selected" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Evidence documents referenced</Label>
                <div className="flex flex-col gap-1.5">
                  {documents.map((doc) => (
                    <label key={doc.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={evidenceIds.has(doc.id)}
                        onCheckedChange={() => toggleEvidence(doc.id)}
                      />
                      {doc.title}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="draft-unsupported">
              Unsupported claims to review (comma-separated, optional)
            </Label>
            <Input
              id="draft-unsupported"
              value={unsupportedClaims}
              onChange={(event) => setUnsupportedClaims(event.target.value)}
              placeholder="Led a team of 10, Shipped feature X"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending || !content.trim()}>
            {isPending ? "Saving…" : "Save draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
