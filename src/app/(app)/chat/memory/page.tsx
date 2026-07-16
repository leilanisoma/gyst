import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MemoryReviewList } from "@/components/chat/memory-review-list";
import { DocumentIndexList } from "@/components/chat/document-index-list";
import { buttonVariants } from "@/components/ui/button";

export default async function MemoryPage() {
  const supabase = await createClient();

  const { data: memoryItems } = await supabase
    .from("memory_items")
    .select("id, kind, text, confidence, source, status, learned_at")
    .neq("status", "deleted")
    .order("learned_at", { ascending: false });

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, kind, file_name")
    .order("created_at", { ascending: false });

  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("document_id");
  const chunkCountByDocument = new Map<string, number>();
  for (const chunk of chunks ?? []) {
    chunkCountByDocument.set(
      chunk.document_id,
      (chunkCountByDocument.get(chunk.document_id) ?? 0) + 1,
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Memory</h1>
          <p className="text-muted-foreground text-sm">
            Everything the assistant has saved or could search. Nothing here is
            trusted as fact until you confirm it.
          </p>
        </div>
        <Link
          href="/chat"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to chat
        </Link>
      </div>

      <MemoryReviewList items={memoryItems ?? []} />

      <DocumentIndexList
        documents={(documents ?? []).map((doc) => ({
          ...doc,
          chunkCount: chunkCountByDocument.get(doc.id) ?? 0,
        }))}
      />
    </main>
  );
}
