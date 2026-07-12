"use client";

import { useDroppable } from "@dnd-kit/core";
import { ApplicationCard } from "./application-card";
import type { ApplicationStage } from "@/lib/recruiting";
import type { ApplicationWithOpportunity } from "./types";

export function ApplicationColumn({
  stage,
  label,
  applications,
}: {
  stage: ApplicationStage;
  label: string;
  applications: ApplicationWithOpportunity[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={
        "border-border bg-muted/40 flex min-h-40 w-64 shrink-0 flex-col gap-2 rounded-xl border p-3 " +
        (isOver ? "ring-ring ring-2" : "")
      }
    >
      <h2 className="text-muted-foreground text-sm font-semibold">
        {label} <span className="font-normal">({applications.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            draggable
          />
        ))}
      </div>
    </div>
  );
}
