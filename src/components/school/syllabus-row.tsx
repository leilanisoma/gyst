"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteSyllabus } from "@/app/(app)/school/documents-actions";
import { extractSyllabusItemsAction } from "@/app/(app)/school/syllabus-extraction-actions";

export function SyllabusRow({
  id,
  title,
  fileName,
  courseTitle,
  downloadUrl,
  aiExtractionEnabled,
}: {
  id: string;
  title: string;
  fileName: string;
  courseTitle: string;
  downloadUrl: string | null;
  aiExtractionEnabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteSyllabus(id);
      if (!result.ok) toast.error(result.error);
    });
  }

  function extract() {
    startTransition(async () => {
      const result = await extractSyllabusItemsAction(id);
      if (!result.ok) toast.error(result.error);
      else toast.success(`Found ${result.itemsCreated} item${result.itemsCreated === 1 ? "" : "s"} to review.`);
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
        {aiExtractionEnabled && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={extract}>
            Extract with AI
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={isPending} onClick={remove}>
          Delete
        </Button>
      </div>
    </div>
  );
}
