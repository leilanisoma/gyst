import { Card, CardContent } from "@/components/ui/card";
import { ApplicationTable } from "./application-table";
import type { ApplicationWithOpportunity } from "./types";

/** Spreadsheet-style table only now — the Kanban board (drag-and-drop columns) was dropped in favor of one plain table with a stage dropdown per row. */
export function ApplicationsView({
  applications,
  ghostedIds,
}: {
  applications: ApplicationWithOpportunity[];
  ghostedIds?: Set<string>;
}) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No opportunities saved yet. Paste a job posting URL or add one
          manually to start tracking it.
        </CardContent>
      </Card>
    );
  }

  return <ApplicationTable applications={applications} ghostedIds={ghostedIds} />;
}
