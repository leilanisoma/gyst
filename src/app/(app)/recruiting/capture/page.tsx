import Link from "next/link";
import { OpportunityForm } from "@/components/recruiting/opportunity-form";

/**
 * Landing target for the "Save to GYST" bookmarklet (task 5.7) — LinkedIn
 * and Handshake have no API worth building an adapter for (PLAN.md §8:
 * "most API permissions require approval... target approved partners
 * rather than personal job discovery"), so capture stays a bookmarklet that
 * hands the current page's URL/title here instead of a full browser
 * extension, which would need store review and cross-browser maintenance
 * for a single-user app.
 */
export default async function RecruitingCapturePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; title?: string; company?: string }>;
}) {
  const { url, title, company } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">Save this posting to GYST</h1>
        <p className="text-muted-foreground text-sm">
          Review the details below, then save — nothing is tracked until you
          confirm.
        </p>
      </div>
      <OpportunityForm
        defaultOpen
        initialValues={{
          url: url ?? "",
          title: title ?? "",
          companyName: company ?? "",
        }}
      />
      <Link href="/recruiting" className="text-muted-foreground text-sm underline underline-offset-2">
        Skip, go to Recruiting
      </Link>
    </main>
  );
}
