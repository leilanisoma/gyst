import { Card, CardContent } from "@/components/ui/card";
import type { ApplicationWithOpportunity } from "./types";

const TERMINAL_STAGES = new Set(["rejected", "withdrawn", "archived", "discovered"]);
const WINDOW_DAYS = 14;

/** Roles whose deadline is close enough that "get to it eventually" stops being a safe plan. */
export function ClosingSoon({
  applications,
}: {
  applications: ApplicationWithOpportunity[];
}) {
  const now = new Date().getTime();
  const cutoff = now + WINDOW_DAYS * 86_400_000;

  const closingSoon = applications
    .filter((application) => {
      const opportunity = application.opportunity;
      if (!opportunity?.deadline || !opportunity.active) return false;
      if (TERMINAL_STAGES.has(application.stage)) return false;
      const deadlineMs = new Date(opportunity.deadline).getTime();
      return deadlineMs >= now && deadlineMs <= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(a.opportunity!.deadline as string).getTime() -
        new Date(b.opportunity!.deadline as string).getTime(),
    );

  if (closingSoon.length === 0) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <h2 className="text-sm font-semibold">
          Closing soon
          <span className="text-muted-foreground font-normal"> — deadline within {WINDOW_DAYS} days</span>
        </h2>
        {closingSoon.map((application) => (
          <p key={application.id} className="text-sm">
            <span className="font-medium">{application.opportunity?.title}</span>
            <span className="text-muted-foreground">
              {" "}
              @ {application.opportunity?.company?.name} — due{" "}
              {new Date(application.opportunity!.deadline as string).toLocaleDateString()}
            </span>
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
