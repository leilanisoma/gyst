"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { ApplicationColumn } from "./application-column";
import { updateApplicationStage } from "@/app/(app)/recruiting/actions";
import {
  APPLICATION_BOARD_STAGES,
  APPLICATION_STAGE_LABELS,
  type ApplicationStage,
} from "@/lib/recruiting";
import type { ApplicationWithOpportunity } from "./types";

export function ApplicationBoard({
  applications: serverApplications,
}: {
  applications: ApplicationWithOpportunity[];
}) {
  const [prevServer, setPrevServer] = useState(serverApplications);
  const [applications, setApplications] = useState(serverApplications);

  if (serverApplications !== prevServer) {
    setPrevServer(serverApplications);
    setApplications(serverApplications);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  function moveApplication(applicationId: string, newStage: ApplicationStage) {
    const application = applications.find((a) => a.id === applicationId);
    if (!application || application.stage === newStage) return;

    const previousStage = application.stage;
    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, stage: newStage } : a)),
    );

    void updateApplicationStage(applicationId, newStage).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        setApplications((prev) =>
          prev.map((a) =>
            a.id === applicationId ? { ...a, stage: previousStage } : a,
          ),
        );
        return;
      }
      toast(`Moved to ${APPLICATION_STAGE_LABELS[newStage]}`);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    moveApplication(active.id as string, over.id as ApplicationStage);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {APPLICATION_BOARD_STAGES.map((stage) => (
          <ApplicationColumn
            key={stage}
            stage={stage}
            label={APPLICATION_STAGE_LABELS[stage]}
            applications={applications.filter((a) => a.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
