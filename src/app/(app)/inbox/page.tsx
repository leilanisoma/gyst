import { createClient } from "@/lib/supabase/server";
import { CaptureForm } from "@/components/capture/capture-form";
import { isAIExtractionEnabled } from "@/ai";
import { InboxList } from "./inbox-list";

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("inbox_items")
    .select("id, raw_text, created_at")
    .eq("status", "inbox")
    .order("created_at", { ascending: false });
  const aiExtractionEnabled = isAIExtractionEnabled();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground text-sm">
          Capture first, organize second. Sort these into tasks, notes, or goals
          when you&apos;re ready.
        </p>
      </div>
      <div className="max-w-xl">
        <CaptureForm />
      </div>
      <InboxList
        items={items ?? []}
        aiExtractionEnabled={aiExtractionEnabled}
      />
    </main>
  );
}
