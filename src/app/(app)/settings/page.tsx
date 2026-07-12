import { createClient } from "@/lib/supabase/server";
import { InstallInstructions } from "@/components/pwa/install-instructions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, timezone")
    .eq("id", data.user?.id ?? "")
    .maybeSingle();

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <dl className="grid max-w-sm gap-2 text-sm">
        <div className="border-border flex justify-between border-b py-2">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{profile?.email ?? data.user?.email}</dd>
        </div>
        <div className="border-border flex justify-between border-b py-2">
          <dt className="text-muted-foreground">Timezone</dt>
          <dd>{profile?.timezone ?? "UTC"}</dd>
        </div>
      </dl>
      <p className="text-muted-foreground max-w-sm text-sm">
        Working hours, notification rules, and AI limits arrive with
        `preferences` in a later phase.
      </p>
      <InstallInstructions />
    </main>
  );
}
