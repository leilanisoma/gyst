"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTimezone } from "@/app/(app)/settings/actions";

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC"];

/**
 * Every date/time computation in the app (Today's timeline, check-in dates,
 * scheduling, quiet hours) reads `profiles.timezone` — this was previously
 * read-only text on this page with no way to actually change it, so it sat
 * at its DB default of `'UTC'` for every profile.
 */
export function TimezoneSelect({ timezone }: { timezone: string }) {
  const [value, setValue] = useState(timezone);
  const [isPending, startTransition] = useTransition();

  function save(next: string) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const result = await updateTimezone(next);
      if (!result.ok) {
        toast.error(result.error);
        setValue(previous);
        return;
      }
      toast.success("Timezone updated.");
    });
  }

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(event) => save(event.target.value)}
      className="border-input bg-background h-8 rounded-md border px-2 text-sm disabled:opacity-50"
    >
      {!TIMEZONES.includes(value) && <option value={value}>{value}</option>}
      {TIMEZONES.map((tz) => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </select>
  );
}
