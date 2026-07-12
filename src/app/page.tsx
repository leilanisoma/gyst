import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        You&apos;re in, {data.user?.email}.
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Today, Inbox, Recruiting, School, and Wellness land here as Phase 1
        continues.
      </p>
      <SignOutButton />
    </main>
  );
}
