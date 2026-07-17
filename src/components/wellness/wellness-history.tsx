"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteWellnessCheckIn } from "@/app/(app)/wellness/actions";
import type { WellnessCheckIn } from "@/lib/wellness";

const FIELD_LABELS: {
  key: keyof Pick<
    WellnessCheckIn,
    "energy" | "mood" | "stress" | "sleep_perception" | "ate_consistently" | "recovery"
  >;
  label: string;
}[] = [
  { key: "energy", label: "Energy" },
  { key: "mood", label: "Mood" },
  { key: "stress", label: "Stress" },
  { key: "sleep_perception", label: "Sleep" },
  { key: "ate_consistently", label: "Ate consistently" },
  { key: "recovery", label: "Recovery" },
];

export function WellnessHistory({ checkIns }: { checkIns: WellnessCheckIn[] }) {
  const [isPending, startTransition] = useTransition();

  function remove(id: string) {
    if (!window.confirm("Delete this check-in? This can't be undone.")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteWellnessCheckIn(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Check-in deleted.");
    });
  }

  if (checkIns.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No wellness check-ins yet — they&rsquo;ll show up here once you save one.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {checkIns.map((checkIn) => {
        const answered = FIELD_LABELS.filter(({ key }) => checkIn[key] !== null);
        return (
          <li
            key={checkIn.id}
            className="border-border flex items-start justify-between gap-3 rounded-lg border p-3"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {new Date(checkIn.check_in_date + "T00:00:00").toLocaleDateString(
                  undefined,
                  { weekday: "short", month: "short", day: "numeric" },
                )}
              </span>
              {answered.length > 0 ? (
                <span className="text-muted-foreground text-xs capitalize">
                  {answered
                    .map(
                      ({ key, label }) =>
                        `${label}: ${String(checkIn[key]).replace(/_/g, " ")}`,
                    )
                    .join(" · ")}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">
                  No fields answered
                </span>
              )}
              {checkIn.note && (
                <span className="text-muted-foreground text-xs italic">
                  &ldquo;{checkIn.note}&rdquo;
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => remove(checkIn.id)}
            >
              Delete
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
