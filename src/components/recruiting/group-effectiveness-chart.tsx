import type { GroupEffectiveness } from "@/lib/recruiting-analytics";

/**
 * Three real series (saved/applied+/offers) per nominal category (source or
 * role family) — this is a genuine multi-series comparison, so it earns a
 * fixed categorical order, unlike a single-series magnitude bar. Note the
 * three counts are nested (saved ⊇ appliedOrBeyond ⊇ offers), not
 * independent parallel totals — each still gets its own full-width bar
 * against the shared scale (a small-multiples-style grouped bar), never
 * concatenated as if they were a stack that sums to 100%.
 *
 * Colors validated 2026-07-21 against this app's actual --chart-1/2/5
 * tokens (dataviz skill's six-checks validator) — the only 3-slot subset of
 * this app's 5-hue chart palette that passes in light mode; chart-3/chart-4
 * fail contrast against the light surface on their own, independent of
 * pairing. Night mode's categorical palette fails outright (every hue too
 * light for the dark surface) — a real, pre-existing gap flagged for its
 * own pass, not fixed here. Direct end-labels are mandatory secondary
 * encoding for the WARN-band adjacent pairs this combination still carries.
 */
const SERIES: { key: keyof GroupEffectiveness; label: string; color: string }[] = [
  { key: "total", label: "Saved", color: "var(--chart-1)" },
  { key: "appliedOrBeyond", label: "Applied+", color: "var(--chart-2)" },
  { key: "offers", label: "Offers", color: "var(--chart-5)" },
];

export function GroupEffectivenessChart({
  title,
  groups,
  labelFor = (key) => key,
}: {
  title: string;
  groups: GroupEffectiveness[];
  labelFor?: (key: string) => string;
}) {
  if (groups.length === 0) return null;
  const max = Math.max(1, ...groups.map((g) => g.total));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">{title}</p>
        <div className="flex items-center gap-3 text-[10px]">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-1">
            <p className="text-xs font-medium">{labelFor(group.key)}</p>
            {SERIES.map((s) => {
              const value = group[s.key] as number;
              const widthPct = Math.max((value / max) * 100, value > 0 ? 3 : 0);
              return (
                <div key={s.key} className="flex items-center gap-1.5">
                  <div className="h-2 w-32 shrink-0 overflow-hidden rounded-sm">
                    <div
                      className="h-2 rounded-r-sm"
                      style={{ width: `${widthPct}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="text-muted-foreground text-[10px] tabular-nums">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
