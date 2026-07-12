import { createClient } from "@/lib/supabase/server";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const firstName = data.user?.email?.split("@")[0] ?? "there";

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Hi, {firstName}.
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        The daily plan, timeline, and top-three outcomes land here in Phase 2.
        For now, head to Inbox to capture a thought or Tasks to see the board.
      </p>
    </main>
  );
}
