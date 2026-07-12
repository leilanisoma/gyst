import { createClient } from "@/lib/supabase/server";
import { CaptureForm } from "@/components/capture/capture-form";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const firstName = data.user?.email?.split("@")[0] ?? "there";

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi, {firstName}.
        </h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          The daily plan, timeline, and top-three outcomes land here in Phase 2.
          For now, capture a thought below or head to Tasks to see the board.
        </p>
      </div>
      <div className="max-w-xl">
        <CaptureForm />
      </div>
    </main>
  );
}
