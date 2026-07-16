import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAIClient } from "@/ai";
import { AppShell } from "@/components/nav/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AppShell
      email={data.user?.email}
      notifications={notifications ?? []}
      chatAvailable={Boolean(getAIClient())}
    >
      {children}
    </AppShell>
  );
}
