"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteDocument,
  setActiveDocument,
} from "@/app/(app)/recruiting/documents-actions";
import type { DocumentKind } from "@/lib/recruiting";

export function DocumentRow({
  id,
  kind,
  title,
  fileName,
  isActive,
  downloadUrl,
}: {
  id: string;
  kind: DocumentKind;
  title: string;
  fileName: string;
  isActive: boolean;
  downloadUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteDocument(id);
      if (!result.ok) toast.error(result.error);
    });
  }

  function makeActive() {
    startTransition(async () => {
      const result = await setActiveDocument(id, kind);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t py-2 text-sm first:border-t-0">
      <div>
        <p className="font-medium">
          {title}
          {isActive && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </p>
        <p className="text-muted-foreground text-xs">{fileName}</p>
      </div>
      <div className="flex items-center gap-2">
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary text-xs underline underline-offset-2"
          >
            Download
          </a>
        )}
        {!isActive && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={makeActive}
          >
            Make active
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={isPending} onClick={remove}>
          Delete
        </Button>
      </div>
    </div>
  );
}
