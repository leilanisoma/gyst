import { createClient } from "@/lib/supabase/server";
import { isAIExtractionEnabled } from "@/ai";
import { Card, CardContent } from "@/components/ui/card";
import { SyllabusUploadForm } from "./syllabus-upload-form";
import { SyllabusRow } from "./syllabus-row";

export async function SyllabusSection({ courses }: { courses: { id: string; title: string }[] }) {
  const supabase = await createClient();
  const aiExtractionEnabled = isAIExtractionEnabled();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, storage_path, file_name, course:courses(title)")
    .eq("kind", "syllabus")
    .order("created_at", { ascending: false });

  const rows = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return {
        ...doc,
        courseTitle: (doc.course as { title: string } | null)?.title ?? "Unknown course",
        downloadUrl: signed?.signedUrl ?? null,
      };
    }),
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Syllabi
            <span className="text-muted-foreground font-normal"> — uploaded per course</span>
          </h2>
          <SyllabusUploadForm courses={courses} />
        </div>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No syllabi uploaded yet.</p>
        ) : (
          <div className="flex flex-col">
            {rows.map((doc) => (
              <SyllabusRow
                key={doc.id}
                id={doc.id}
                title={doc.title}
                fileName={doc.file_name}
                courseTitle={doc.courseTitle}
                downloadUrl={doc.downloadUrl}
                aiExtractionEnabled={aiExtractionEnabled}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
