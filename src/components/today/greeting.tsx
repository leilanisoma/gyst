"use client";

import { useEffect, useState } from "react";
import { getGreetingPhrase } from "@/lib/greeting";

/** How often to recheck the clock while the app stays open in one tab. */
const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * The hub's cheeky time-of-day greeting (Phase 9D, 2026-07-20) — "Good
 * morning" / "Still up?" etc. from `getGreetingPhrase`, same accepted
 * tradeoff as `DayPeriodProvider`: `fallbackPhrase` is whatever the server
 * computed (its own clock, possibly a different timezone), corrected
 * against the real device clock once this mounts client-side.
 */
export function Greeting({
  name,
  fallbackPhrase,
}: {
  name: string;
  fallbackPhrase: string;
}) {
  const [phrase, setPhrase] = useState(fallbackPhrase);

  useEffect(() => {
    const apply = () => setPhrase(getGreetingPhrase());
    apply();
    const id = window.setInterval(apply, RECHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      {phrase}, {name}.
    </>
  );
}
