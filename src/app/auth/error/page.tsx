import Link from "next/link";
import { Button } from "@/components/ui/button";

const MESSAGES: Record<string, string> = {
  not_allowed: "This app is restricted to a single account, and this isn't it.",
  exchange_failed: "That sign-in link didn't work — it may have expired.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message =
    (reason && MESSAGES[reason]) ?? "Something went wrong signing you in.";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button render={<Link href="/login">Back to sign in</Link>} />
    </main>
  );
}
