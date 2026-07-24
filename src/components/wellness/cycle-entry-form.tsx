"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { saveCycleObservationEntry } from "@/app/(app)/wellness/actions";

function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Manual single-day entry for fertility-monitor hormone readings, tested
 * every other day rather than daily — separate from the CSV import
 * (flow/symptoms/note bulk backfill) below it.
 */
export function CycleEntryForm({ dateString }: { dateString: string }) {
  const [date, setDate] = useState(dateString);
  const [onPeriod, setOnPeriod] = useState(false);
  const [lh, setLh] = useState("");
  const [e3g, setE3g] = useState("");
  const [pdg, setPdg] = useState("");
  const [fsh, setFsh] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setDate(dateString);
    setOnPeriod(false);
    setLh("");
    setE3g("");
    setPdg("");
    setFsh("");
  }

  function save() {
    startTransition(async () => {
      const result = await saveCycleObservationEntry({
        observation_date: date,
        on_period: onPeriod,
        lh: toNumberOrNull(lh),
        e3g: toNumberOrNull(e3g),
        pdg: toNumberOrNull(pdg),
        fsh: toNumberOrNull(fsh),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry saved.");
      reset();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        Fertility-monitor readings, logged the days you test.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cycle-entry-date">Date</Label>
        <Input
          id="cycle-entry-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={onPeriod} onCheckedChange={(checked) => setOnPeriod(checked === true)} />
        On my period
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cycle-entry-lh">LH (mIU/mL)</Label>
          <Input
            id="cycle-entry-lh"
            type="number"
            min={0}
            step="any"
            value={lh}
            onChange={(event) => setLh(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cycle-entry-fsh">FSH (mIU/mL)</Label>
          <Input
            id="cycle-entry-fsh"
            type="number"
            min={0}
            step="any"
            value={fsh}
            onChange={(event) => setFsh(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cycle-entry-e3g">E3G (ng/mL)</Label>
          <Input
            id="cycle-entry-e3g"
            type="number"
            min={0}
            step="any"
            value={e3g}
            onChange={(event) => setE3g(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cycle-entry-pdg">PdG (µg/mL)</Label>
          <Input
            id="cycle-entry-pdg"
            type="number"
            min={0}
            step="any"
            value={pdg}
            onChange={(event) => setPdg(event.target.value)}
          />
        </div>
      </div>

      <Button onClick={save} disabled={isPending} size="sm" className="self-start">
        {isPending ? "Saving…" : "Log entry"}
      </Button>
    </div>
  );
}
