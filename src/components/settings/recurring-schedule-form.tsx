"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRecurringSchedule } from "@/app/(app)/settings/actions";
import { DAY_LABELS, type ScheduleCategory } from "@/lib/recurring-schedules";

export function RecurringScheduleForm({
  category,
  triggerLabel,
}: {
  category: ScheduleCategory;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setDayOfWeek("1");
    setStartTime("09:00");
    setEndTime("10:00");
    setLocation("");
  }

  function save() {
    startTransition(async () => {
      const result = await createRecurringSchedule({
        title,
        category,
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        location: location.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${category}-title`}>Title</Label>
            <Input
              id={`${category}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                category === "fencing" ? "Fencing practice" : "CS 101 lecture"
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Day</Label>
            <Select
              value={dayOfWeek}
              onValueChange={(value) => value && setDayOfWeek(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_LABELS.map((label, index) => (
                  <SelectItem key={label} value={String(index)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${category}-start`}>Start</Label>
              <Input
                id={`${category}-start`}
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${category}-end`}>End</Label>
              <Input
                id={`${category}-end`}
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${category}-location`}>Location (optional)</Label>
            <Input
              id={`${category}-location`}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending || !title.trim()}>
            {isPending ? "Saving…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
