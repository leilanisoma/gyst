"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteSyllabus } from "@/app/(app)/school/documents-actions";

export function SyllabusRow({
  id,
  title,
  fileName,
  courseTitle,
  downloadUrl,
}: {
  id: string;
  title: string;
  fileName: string;
  courseTitle: string;
  downloadUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteSyllabus(id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t py-2 text-sm first:border-t-0">
      <div>
        <p className="font-medium">
          {title} <span className="text-muted-foreground font-normal">— {courseTitle}</span>
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
        <Button size="sm" variant="ghost" disabled={isPending} onClick={remove}>
          Delete
        </Button>
      </div>
    </div>
  );
}
