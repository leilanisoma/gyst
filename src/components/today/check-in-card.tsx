"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertCheckIn } from "@/app/(app)/actions";
import {
  ENERGY_LEVELS,
  MOODS,
  SLEEP_PERCEPTIONS,
  STRESS_LEVELS,
  defaultCapacityMinutes,
  type CheckIn,
  type Energy,
  type Mood,
  type SleepPerception,
  type Stress,
} from "@/lib/check-ins";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function CheckInCard({
  checkIn,
  dateString,
}: {
  checkIn: CheckIn | null;
  dateString: string;
}) {
  const [energy, setEnergy] = useState<Energy | null>(checkIn?.energy ?? null);
  const [capacityMinutes, setCapacityMinutes] = useState(
    checkIn?.capacity_minutes?.toString() ?? "",
  );
  const [mood, setMood] = useState<Mood | null>(checkIn?.mood ?? null);
  const [stress, setStress] = useState<Stress | null>(checkIn?.stress ?? null);
  const [sleepPerception, setSleepPerception] =
    useState<SleepPerception | null>(checkIn?.sleep_perception ?? null);
  const [note, setNote] = useState(checkIn?.note ?? "");
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function pickEnergy(level: Energy) {
    setEnergy(level);
    if (!capacityMinutes) {
      setCapacityMinutes(defaultCapacityMinutes(level).toString());
    }
  }

  function save() {
    if (!energy) return;
    startTransition(async () => {
      const result = await upsertCheckIn({
        check_in_date: dateString,
        energy,
        mood,
        stress,
        sleep_perception: sleepPerception,
        capacity_minutes: capacityMinutes ? Number(capacityMinutes) : null,
        note: note.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Check-in saved.");
    });
  }

  return (
    <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">How&rsquo;s today?</h2>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground text-xs hover:underline"
        >
          {expanded ? "Less detail" : "More detail"}
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Energy</Label>
        <div className="flex gap-2">
          {ENERGY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => pickEnergy(level)}
              className={cn(
                buttonVariants({
                  variant: energy === level ? "default" : "outline",
                  size: "sm",
                }),
                "capitalize",
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="capacity-minutes">Focus capacity today (minutes)</Label>
        <Input
          id="capacity-minutes"
          type="number"
          min={0}
          value={capacityMinutes}
          onChange={(event) => setCapacityMinutes(event.target.value)}
          placeholder="Auto-suggested from energy"
        />
      </div>

      {expanded && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Mood</Label>
              <Select
                value={mood ?? undefined}
                onValueChange={(value) => setMood((value as Mood) ?? null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Skip" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Stress</Label>
              <Select
                value={stress ?? undefined}
                onValueChange={(value) => setStress((value as Stress) ?? null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Skip" />
                </SelectTrigger>
                <SelectContent>
                  {STRESS_LEVELS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Sleep last night</Label>
            <Select
              value={sleepPerception ?? undefined}
              onValueChange={(value) =>
                setSleepPerception((value as SleepPerception) ?? null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Skip" />
              </SelectTrigger>
              <SelectContent>
                {SLEEP_PERCEPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="check-in-note">Note (optional)</Label>
            <Textarea
              id="check-in-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
            />
          </div>
        </div>
      )}

      <Button
        onClick={save}
        disabled={!energy || isPending}
        size="sm"
        className="self-start"
      >
        {isPending ? "Saving…" : checkIn ? "Update check-in" : "Save check-in"}
      </Button>
    </section>
  );
}
