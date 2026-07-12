import { Card, CardContent } from "@/components/ui/card";
import type { ApplicationWithOpportunity } from "./types";

const TERMINAL_STAGES = new Set(["rejected", "withdrawn", "archived"]);

export function FollowUpsDue({
  applications,
}: {
  applications: ApplicationWithOpportunity[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const due = applications
    .filter(
      (application) =>
        application.next_action_date &&
        application.next_action_date.slice(0, 10) <= today &&
        !TERMINAL_STAGES.has(application.stage),
    )
    .sort((a, b) =>
      (a.next_action_date ?? "").localeCompare(b.next_action_date ?? ""),
    );

  if (due.length === 0) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <h2 className="text-sm font-semibold">Follow-ups due</h2>
        {due.map((application) => (
          <p key={application.id} className="text-sm">
            <span className="font-medium">{application.opportunity?.title}</span>
            <span className="text-muted-foreground">
              {" "}
              @ {application.opportunity?.company?.name} — {application.next_action}
              {" "}
              (
              {new Date(application.next_action_date as string).toLocaleDateString()}
              )
            </span>
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
