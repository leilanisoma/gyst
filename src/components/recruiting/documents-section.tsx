import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentUploadForm } from "./document-upload-form";
import { DocumentRow } from "./document-row";
import { DOCUMENT_KIND_LABELS, type DocumentKind } from "@/lib/recruiting";

export async function DocumentsSection() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, kind, title, storage_path, file_name, is_active")
    .order("created_at", { ascending: false });

  const rows = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return { ...doc, downloadUrl: signed?.signedUrl ?? null };
    }),
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Documents
            <span className="text-muted-foreground font-normal">
              {" "}
              — resume versions, transcript, writing samples
            </span>
          </h2>
          <DocumentUploadForm />
        </div>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No documents uploaded yet.
          </p>
        ) : (
          <div className="flex flex-col">
            {rows.map((doc) => (
              <DocumentRow
                key={doc.id}
                id={doc.id}
                kind={doc.kind as DocumentKind}
                title={`${doc.title} (${DOCUMENT_KIND_LABELS[doc.kind as DocumentKind]})`}
                fileName={doc.file_name}
                isActive={doc.is_active}
                downloadUrl={doc.downloadUrl}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
