"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteRecurringSchedule } from "@/app/(app)/settings/actions";
import {
  SCHEDULE_CATEGORY_LABELS,
  groupSchedulesByDay,
  type RecurringSchedule,
} from "@/lib/recurring-schedules";

function formatTimeRange(start: string, end: string) {
  const toLabel = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };
  return `${toLabel(start)} – ${toLabel(end)}`;
}

export function RecurringScheduleList({
  schedules,
}: {
  schedules: RecurringSchedule[];
}) {
  const [isPending, startTransition] = useTransition();

  if (schedules.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No recurring schedule yet — add classes or fencing sessions above.
      </p>
    );
  }

  const days = groupSchedulesByDay(schedules).filter(
    (day) => day.schedules.length > 0,
  );

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteRecurringSchedule(id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {days.map((day) => (
        <div key={day.day} className="flex flex-col gap-1.5">
          <h3 className="text-muted-foreground text-xs font-medium">
            {day.label}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {day.schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="border-border bg-card flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{schedule.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatTimeRange(schedule.start_time, schedule.end_time)}
                    {schedule.location ? ` · ${schedule.location}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">
                    {SCHEDULE_CATEGORY_LABELS[schedule.category]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => remove(schedule.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
