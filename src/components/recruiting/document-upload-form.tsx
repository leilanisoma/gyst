"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createClient } from "@/lib/supabase/client";
import { createDocumentRecord } from "@/app/(app)/recruiting/documents-actions";
import {
  DOCUMENT_KINDS,
  DOCUMENT_KIND_LABELS,
  type DocumentKind,
} from "@/lib/recruiting";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function DocumentUploadForm() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DocumentKind>("resume");
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setKind("resume");
    setTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function save() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        toast.error("Not signed in.");
        return;
      }

      const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file);
      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const result = await createDocumentRecord({
        kind,
        title: title.trim() || file.name,
        storagePath,
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Document uploaded.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Upload document
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Kind</Label>
            <Select
              value={kind}
              onValueChange={(value) => value && setKind(value as DocumentKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_KINDS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {DOCUMENT_KIND_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Resume — PM focus"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-file">File</Label>
            <input
              id="doc-file"
              ref={fileInputRef}
              type="file"
              className="text-sm"
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
