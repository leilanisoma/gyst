"use client";

import { useState } from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreEditForm } from "./score-edit-form";
import { ApplicationDetailSheet } from "./application-detail-sheet";
import { firstScore, type ApplicationWithOpportunity } from "./types";
import { ROLE_FAMILY_LABELS } from "@/lib/recruiting";

export function ApplicationCard({
  application,
  draggable = false,
}: {
  application: ApplicationWithOpportunity;
  draggable?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const opportunity = application.opportunity;
  const drag = useDraggable({ id: application.id, disabled: !draggable });

  if (!opportunity) return null;
  const score = firstScore(opportunity.job_scores);

  return (
    <Card
      ref={draggable ? drag.setNodeRef : undefined}
      style={
        draggable && drag.transform
          ? {
              transform: `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`,
            }
          : undefined
      }
      className={draggable && drag.isDragging ? "z-10 opacity-70" : undefined}
    >
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="text-left font-medium hover:underline"
            >
              {opportunity.title}
              <span className="text-muted-foreground font-normal">
                {" "}
                @ {opportunity.company?.name ?? "Unknown company"}
              </span>
            </button>
            <p className="text-muted-foreground text-xs">
              {ROLE_FAMILY_LABELS[opportunity.role_family]}
              {opportunity.location ? ` · ${opportunity.location}` : ""}
              {opportunity.deadline
                ? ` · due ${new Date(opportunity.deadline).toLocaleDateString()}`
                : ""}
            </p>
          </div>
          {score && (
            <Badge variant={score.excluded ? "destructive" : "outline"}>
              {score.excluded ? score.exclusion_reason : `${score.total_score}/100`}
            </Badge>
          )}
        </div>
        {score && !score.excluded && (
          <p className="text-muted-foreground text-xs">{score.explanation}</p>
        )}
        {application.next_action && (
          <p className="text-xs">
            Next: {application.next_action}
            {application.next_action_date
              ? ` by ${new Date(application.next_action_date).toLocaleDateString()}`
              : ""}
          </p>
        )}
        <div className="flex items-center gap-3">
          {score && <ScoreEditForm opportunityId={opportunity.id} score={score} />}
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
        {draggable && (
          <button
            type="button"
            {...drag.listeners}
            {...drag.attributes}
            aria-label="Drag to change stage"
            className="text-muted-foreground/60 cursor-grab self-start text-xs active:cursor-grabbing"
          >
            ⠿ drag
          </button>
        )}
      </CardContent>
      <ApplicationDetailSheet
        application={application}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </Card>
  );
}
