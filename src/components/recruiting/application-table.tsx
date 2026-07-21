"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ApplicationDetailSheet } from "./application-detail-sheet";
import { updateApplicationStage } from "@/app/(app)/recruiting/actions";
import {
  APPLICATION_STAGES,
  APPLICATION_STAGE_LABELS,
  ROLE_FAMILY_LABELS,
  type ApplicationStage,
} from "@/lib/recruiting";
import { firstScore, sortByScore, type ApplicationWithOpportunity } from "./types";

export function ApplicationTable({
  applications: serverApplications,
  ghostedIds,
}: {
  applications: ApplicationWithOpportunity[];
  ghostedIds?: Set<string>;
}) {
  const [prevServer, setPrevServer] = useState(serverApplications);
  const [applications, setApplications] = useState(serverApplications);
  const [detailApplicationId, setDetailApplicationId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (serverApplications !== prevServer) {
    setPrevServer(serverApplications);
    setApplications(serverApplications);
  }

  function changeStage(applicationId: string, newStage: ApplicationStage) {
    const previous = applications;
    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, stage: newStage } : a)),
    );
    startTransition(async () => {
      const result = await updateApplicationStage(applicationId, newStage);
      if (!result.ok) {
        toast.error(result.error);
        setApplications(previous);
      }
    });
  }

  const sorted = sortByScore(applications);
  const detailApplication = applications.find((a) => a.id === detailApplicationId);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
          <tr>
            <th className="p-3 font-medium">Role</th>
            <th className="p-3 font-medium">Company</th>
            <th className="p-3 font-medium">Role family</th>
            <th className="p-3 font-medium">Score</th>
            <th className="p-3 font-medium">Stage</th>
            <th className="p-3 font-medium">Deadline</th>
            <th className="p-3 font-medium">Next action</th>
            <th className="p-3 font-medium">Link</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((application) => {
            const opportunity = application.opportunity;
            if (!opportunity) return null;
            const score = firstScore(opportunity.job_scores);

            return (
              <tr key={application.id} className="border-t">
                <td className="p-3 font-medium">
                  <button
                    type="button"
                    onClick={() => setDetailApplicationId(application.id)}
                    className="text-left hover:underline"
                  >
                    {opportunity.title}
                  </button>
                  {ghostedIds?.has(application.id) && (
                    <Badge variant="destructive" className="ml-2">
                      Ghosted
                    </Badge>
                  )}
                </td>
                <td className="p-3">{opportunity.company?.name ?? "—"}</td>
                <td className="p-3">{ROLE_FAMILY_LABELS[opportunity.role_family]}</td>
                <td className="p-3">
                  {score ? (
                    <Badge variant={score.excluded ? "destructive" : "outline"}>
                      {score.excluded ? score.exclusion_reason : `${score.total_score}/100`}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">
                  <Select
                    value={application.stage}
                    onValueChange={(value) =>
                      value && changeStage(application.id, value as ApplicationStage)
                    }
                  >
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {APPLICATION_STAGE_LABELS[stage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3">
                  {opportunity.deadline
                    ? new Date(opportunity.deadline).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3">{application.next_action ?? "—"}</td>
                <td className="p-3">
                  {opportunity.url ? (
                    <Link
                      href={opportunity.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="View posting"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {detailApplication && (
        <ApplicationDetailSheet
          application={detailApplication}
          open={detailApplicationId !== null}
          onOpenChange={(open) => !open && setDetailApplicationId(null)}
        />
      )}
    </div>
  );
}
