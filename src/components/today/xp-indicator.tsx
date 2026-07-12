export function XpIndicator({
  xp,
  daysEngaged,
}: {
  xp: number;
  daysEngaged: number;
}) {
  return (
    <p className="text-muted-foreground text-xs">
      {xp} XP · {daysEngaged}/7 days this week
    </p>
  );
}
