"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertDailyPlan } from "@/app/(app)/actions";
import type { DailyPlan } from "@/lib/daily-plans";

export function TopOutcomesCard({
  plan,
  dateString,
}: {
  plan: DailyPlan | null;
  dateString: string;
}) {
  const [outcome1, setOutcome1] = useState(plan?.outcome_1 ?? "");
  const [outcome2, setOutcome2] = useState(plan?.outcome_2 ?? "");
  const [outcome3, setOutcome3] = useState(plan?.outcome_3 ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await upsertDailyPlan({
        plan_date: dateString,
        outcome_1: outcome1,
        outcome_2: outcome2,
        outcome_3: outcome3,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved.");
    });
  }

  return (
    <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <h2 className="text-sm font-semibold">
          If today goes well, what&rsquo;s true?
        </h2>
        <p className="text-muted-foreground text-xs">Up to three outcomes.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Input
          value={outcome1}
          onChange={(event) => setOutcome1(event.target.value)}
          placeholder="Outcome 1"
        />
        <Input
          value={outcome2}
          onChange={(event) => setOutcome2(event.target.value)}
          placeholder="Outcome 2"
        />
        <Input
          value={outcome3}
          onChange={(event) => setOutcome3(event.target.value)}
          placeholder="Outcome 3"
        />
      </div>
      <Button
        onClick={save}
        disabled={isPending}
        size="sm"
        className="self-start"
      >
        {isPending ? "Saving…" : "Save"}
      </Button>
    </section>
  );
}
