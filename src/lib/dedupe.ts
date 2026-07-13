/**
 * Generic fuzzy dedup helpers for cross-source calendar/event matching
 * (PLAN.md §15 task 6.9) — different from `recruiting.ts`'s
 * `opportunityFingerprint`, which dedupes by an exact key. Two sources
 * (Canvas, Google Calendar) will never share a stable external ID for the
 * "same" real-world event, so this compares on normalized title text plus
 * a start-time window instead.
 */
export function normalizeEventTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function titlesAreSimilar(a: string, b: string): boolean {
  const na = normalizeEventTitle(a);
  const nb = normalizeEventTitle(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function isLikelyDuplicateEvent(
  candidate: { title: string; startAt: Date },
  existing: { title: string; startAt: Date }[],
  windowMinutes = 60,
): boolean {
  const windowMs = windowMinutes * 60_000;
  return existing.some(
    (event) =>
      Math.abs(event.startAt.getTime() - candidate.startAt.getTime()) <= windowMs &&
      titlesAreSimilar(candidate.title, event.title),
  );
}
