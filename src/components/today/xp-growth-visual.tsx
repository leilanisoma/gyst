import { growthStage } from "@/lib/gamification";
import { GrowthPlant } from "@/components/room/growth-plant";

/**
 * Ambient room-growth visual (Phase 9D §13) replacing the numeric XP/
 * "days engaged" readout — same `xp_events` data, display only. Rendering
 * lives in `GrowthPlant`; this wrapper just derives stage/brightness from
 * XP the way the hub always has.
 */
export function XpGrowthVisual({
  xp,
  daysEngaged,
}: {
  xp: number;
  daysEngaged: number;
}) {
  const stage = growthStage(xp);
  const brightness = 0.75 + (daysEngaged / 7) * 0.4;

  return (
    <GrowthPlant
      stage={stage}
      brightness={brightness}
      ariaLabel={`Growing steadily — ${xp} XP, ${daysEngaged} of 7 days engaged this week`}
      title={`${xp} XP · ${daysEngaged}/7 days this week`}
    />
  );
}
