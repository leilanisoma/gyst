"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateApplicationStage } from "@/app/(app)/recruiting/actions";
import { setOpportunityFeedback } from "@/app/(app)/recruiting/feedback-actions";
import { ROLE_FAMILY_LABELS } from "@/lib/recruiting";
import { firstScore, sortByScore, type ApplicationWithOpportunity } from "./types";

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  curated_feed: "Curated feed",
  manual: "Manual",
};

export function DiscoveryQueue({
  applications: serverApplications,
}: {
  applications: ApplicationWithOpportunity[];
}) {
  const [prevServer, setPrevServer] = useState(serverApplications);
  const [applications, setApplications] = useState(serverApplications);
  const [isPending, startTransition] = useTransition();

  if (serverApplications !== prevServer) {
    setPrevServer(serverApplications);
    setApplications(serverApplications);
  }

  function removeFromQueue(applicationId: string) {
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
  }

  function save(application: ApplicationWithOpportunity) {
    startTransition(async () => {
      const result = await updateApplicationStage(application.id, "saved");
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved — now tracked in your pipeline.");
      removeFromQueue(application.id);
    });
  }

  function feedback(application: ApplicationWithOpportunity, value: "up" | "down" | "not_relevant") {
    if (!application.opportunity) return;
    startTransition(async () => {
      const result = await setOpportunityFeedback(application.id, application.opportunity!.id, value);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (value === "not_relevant") {
        toast("Dismissed — won't resurface this one.");
        removeFromQueue(application.id);
      }
    });
  }

  if (applications.length === 0) {
    return null;
  }

  const sorted = sortByScore(applications);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className="text-sm font-semibold">
          Discovery queue
          <span className="text-muted-foreground font-normal">
            {" "}
            — {applications.length} new opportunit{applications.length === 1 ? "y" : "ies"} to triage
          </span>
        </h2>
        <div className="flex flex-col gap-2">
          {sorted.map((application) => {
            const opportunity = application.opportunity;
            if (!opportunity) return null;
            const score = firstScore(opportunity.job_scores);

            return (
              <div key={application.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{opportunity.title}</span>
                    <span className="text-muted-foreground text-sm">@ {opportunity.company?.name ?? "Unknown"}</span>
                    {score && (
                      <Badge variant={score.excluded ? "destructive" : "outline"}>
                        {score.excluded ? score.exclusion_reason : `${score.total_score}/100`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {ROLE_FAMILY_LABELS[opportunity.role_family]}
                    {opportunity.location ? ` · ${opportunity.location}` : ""}
                    {opportunity.deadline ? ` · due ${new Date(opportunity.deadline).toLocaleDateString()}` : ""}
                    {" · via "}
                    {SOURCE_LABELS[opportunity.source] ?? opportunity.source}
                  </p>
                  {opportunity.url && (
                    <Link
                      href={opportunity.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-xs underline underline-offset-2"
                    >
                      View posting
                    </Link>
                  )}
                </div>
                <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant={opportunity.feedback === "up" ? "default" : "ghost"}
                    onClick={() => feedback(application, "up")}
                    disabled={isPending}
                    aria-label="Thumbs up"
                  >
                    👍
                  </Button>
                  <Button
                    size="sm"
                    variant={opportunity.feedback === "down" ? "default" : "ghost"}
                    onClick={() => feedback(application, "down")}
                    disabled={isPending}
                    aria-label="Thumbs down"
                  >
                    👎
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => feedback(application, "not_relevant")} disabled={isPending}>
                    Not relevant
                  </Button>
                  <Button size="sm" onClick={() => save(application)} disabled={isPending}>
                    Save
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
