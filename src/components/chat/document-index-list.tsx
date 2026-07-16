"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { indexDocument } from "@/app/(app)/chat/documents-actions";

type DocumentRow = {
  id: string;
  title: string;
  kind: string;
  file_name: string;
  chunkCount: number;
};

/** Lets Ishani opt individual documents into search_documents (task 8.4) — indexing isn't automatic on upload, so nothing gets chunked/embedded without her choosing to. */
export function DocumentIndexList({ documents }: { documents: DocumentRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleIndex(documentId: string) {
    startTransition(async () => {
      const result = await indexDocument(documentId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Indexed ${result.chunksIndexed} chunk(s) (${result.chunksReused} reused).`,
      );
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className="text-sm font-semibold">
          Searchable documents
          <span className="text-muted-foreground font-normal">
            {" "}
            — index a document so search_documents can find it and cite it
          </span>
        </h2>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No documents uploaded yet.
          </p>
        ) : (
          <div className="flex flex-col">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 border-t py-2 text-sm first:border-t-0"
              >
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {doc.file_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.chunkCount > 0 && (
                    <Badge variant="secondary">
                      {doc.chunkCount} chunks indexed
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => handleIndex(doc.id)}
                  >
                    {doc.chunkCount > 0 ? "Re-index" : "Index for search"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
