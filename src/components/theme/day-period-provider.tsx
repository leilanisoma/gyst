"use client";

import { useEffect } from "react";
import { getDayPeriod } from "@/lib/day-period";

/** How often to recheck the clock while the app stays open in one tab. */
const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Sets `data-day-period` on `<html>` so `globals.css` can theme the whole
 * app by time of day (Phase 9D). Renders nothing — mount once in the root
 * layout. Runs client-side against the local clock (see `day-period.ts`);
 * the small flash of the default period before hydration is an accepted
 * tradeoff for keeping this out of the server render path.
 */
export function DayPeriodProvider() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.dayPeriod = getDayPeriod();
    };
    apply();
    const id = window.setInterval(apply, RECHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
