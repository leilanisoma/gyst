import { createClient } from "@/lib/supabase/server";
import { CaptureForm } from "@/components/capture/capture-form";
import { RoomBackground } from "@/components/room/room-background";
import { RoomContentPanel } from "@/components/room/room-content-panel";
import { RoomExitOverlay } from "@/components/room/room-exit-overlay";
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
    <main className="relative isolate flex h-screen flex-col items-center justify-center p-4">
      <RoomBackground room="living-room" />
      <RoomExitOverlay href="/" />
      <RoomContentPanel>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground text-sm">
            Capture first, organize second. Sort these into tasks, notes, or
            goals when you&apos;re ready.
          </p>
        </div>
        <div className="max-w-xl">
          <CaptureForm />
        </div>
        <InboxList
          items={items ?? []}
          aiExtractionEnabled={aiExtractionEnabled}
        />
      </RoomContentPanel>
    </main>
  );
}
