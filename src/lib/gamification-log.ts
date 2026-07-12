import type { createClient } from "@/lib/supabase/server";
import {
  shouldAwardReturnBonus,
  XP_POINTS,
  type XpEventType,
} from "./gamification";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Records one XP event, at most once per (user, event type, day) so editing
 * or retrying an action doesn't farm XP. On the day's first event, also
 * checks for a return-after-absence bonus. Server-only — call from within a
 * "use server" action, never directly from a client component.
 */
export async function logXpEvent(
  supabase: SupabaseServerClient,
  userId: string,
  eventType: XpEventType,
  occurredOn: string,
): Promise<void> {
  const { data: todayEvents } = await supabase
    .from("xp_events")
    .select("event_type")
    .eq("user_id", userId)
    .eq("occurred_on", occurredOn);

  const todayTypes = new Set(
    (todayEvents ?? []).map((event) => event.event_type),
  );

  if (todayTypes.size === 0) {
    const { data: priorEvents } = await supabase
      .from("xp_events")
      .select("occurred_on")
      .eq("user_id", userId)
      .neq("occurred_on", occurredOn);
    const priorDates = Array.from(
      new Set((priorEvents ?? []).map((event) => event.occurred_on)),
    );

    if (shouldAwardReturnBonus(priorDates, occurredOn)) {
      await supabase.from("xp_events").insert({
        user_id: userId,
        event_type: "return_from_absence",
        points: XP_POINTS.return_from_absence,
        occurred_on: occurredOn,
      });
    }
  }

  if (todayTypes.has(eventType)) return;

  await supabase.from("xp_events").insert({
    user_id: userId,
    event_type: eventType,
    points: XP_POINTS[eventType],
    occurred_on: occurredOn,
  });
}
