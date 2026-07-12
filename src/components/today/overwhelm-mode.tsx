"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buildOverwhelmPlan } from "@/lib/overwhelm";
import { ENERGY_LEVELS, type Energy } from "@/lib/check-ins";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/tasks";

function PlanCard({
  label,
  task,
  emptyMessage,
}: {
  label: string;
  task: Task | null;
  emptyMessage: string;
}) {
  return (
    <div className="border-border bg-card rounded-lg border p-3">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      {task ? (
        <p className="text-sm font-medium">{task.title}</p>
      ) : (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      )}
    </div>
  );
}

export function OverwhelmMode({ tasks, now }: { tasks: Task[]; now: Date }) {
  const [open, setOpen] = useState(false);
  const [energy, setEnergy] = useState<Energy | null>(null);

  const plan = useMemo(
    () => (energy ? buildOverwhelmPlan(tasks, now, energy) : null),
    [tasks, now, energy],
  );

  function close() {
    setOpen(false);
    setEnergy(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setEnergy(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        I&rsquo;m overwhelmed
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!energy ? (
          <>
            <DialogHeader>
              <DialogTitle>How&rsquo;s your energy right now?</DialogTitle>
              <DialogDescription>
                We&rsquo;ll protect your fixed commitments and find the smallest
                day that still counts.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergy(level)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "flex-1 capitalize",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Here&rsquo;s the smallest day that still counts.
              </DialogTitle>
              <DialogDescription>
                Everything else is set aside for later, not lost.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <PlanCard
                label="One urgent task"
                task={plan?.urgent ?? null}
                emptyMessage="Nothing urgent open — take the win."
              />
              <PlanCard
                label="One small life-maintenance task"
                task={plan?.lifeMaintenance ?? null}
                emptyMessage="Nothing small queued right now."
              />
              <PlanCard
                label="One self-care action"
                task={plan?.selfCare ?? null}
                emptyMessage="No wellness task queued — a 10-minute walk or stretch counts."
              />
              {plan?.starterStep && (
                <p className="text-muted-foreground text-sm">
                  {plan.starterStep}
                </p>
              )}
              {plan && plan.reviewQueue.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-muted-foreground text-xs font-medium">
                    Set aside for later ({plan.reviewQueue.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.reviewQueue.map((task) => (
                      <Badge key={task.id} variant="secondary">
                        {task.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button onClick={close} size="sm" className="self-start">
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
