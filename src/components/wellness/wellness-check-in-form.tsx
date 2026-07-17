"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertWellnessCheckIn } from "@/app/(app)/wellness/actions";
import {
  ATE_CONSISTENTLY_OPTIONS,
  ENERGY_LEVELS,
  MOODS,
  RECOVERY_LEVELS,
  SLEEP_PERCEPTIONS,
  STRESS_LEVELS,
  type AteConsistently,
  type Energy,
  type Mood,
  type Recovery,
  type SleepPerception,
  type Stress,
  type WellnessCheckIn,
} from "@/lib/wellness";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const ATE_CONSISTENTLY_LABELS: Record<AteConsistently, string> = {
  yes: "Yes",
  somewhat: "Somewhat",
  no: "No",
  prefer_not_to_say: "Prefer not to say",
};

export function WellnessCheckInForm({
  checkIn,
  dateString,
}: {
  checkIn: WellnessCheckIn | null;
  dateString: string;
}) {
  const [energy, setEnergy] = useState<Energy | null>(checkIn?.energy ?? null);
  const [mood, setMood] = useState<Mood | null>(checkIn?.mood ?? null);
  const [stress, setStress] = useState<Stress | null>(checkIn?.stress ?? null);
  const [sleepPerception, setSleepPerception] = useState<SleepPerception | null>(
    checkIn?.sleep_perception ?? null,
  );
  const [ateConsistently, setAteConsistently] = useState<AteConsistently | null>(
    checkIn?.ate_consistently ?? null,
  );
  const [recovery, setRecovery] = useState<Recovery | null>(
    checkIn?.recovery ?? null,
  );
  const [note, setNote] = useState(checkIn?.note ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await upsertWellnessCheckIn({
        check_in_date: dateString,
        energy,
        mood,
        stress,
        sleep_perception: sleepPerception,
        ate_consistently: ateConsistently,
        recovery,
        note: note.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Wellness check-in saved.");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Energy</Label>
        <div className="flex gap-2">
          {ENERGY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEnergy((current) => (current === level ? null : level))}
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
                <SelectItem key={value} value={value} className="capitalize">
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
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Recovery</Label>
          <Select
            value={recovery ?? undefined}
            onValueChange={(value) => setRecovery((value as Recovery) ?? null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Skip" />
            </SelectTrigger>
            <SelectContent>
              {RECOVERY_LEVELS.map((value) => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ate consistently today</Label>
        <Select
          value={ateConsistently ?? undefined}
          onValueChange={(value) =>
            setAteConsistently((value as AteConsistently) ?? null)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Skip" />
          </SelectTrigger>
          <SelectContent>
            {ATE_CONSISTENTLY_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {ATE_CONSISTENTLY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wellness-check-in-note">Note (optional)</Label>
        <Textarea
          id="wellness-check-in-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
        />
      </div>

      <Button onClick={save} disabled={isPending} size="sm" className="self-start">
        {isPending ? "Saving…" : checkIn ? "Update check-in" : "Save check-in"}
      </Button>
    </div>
  );
}
