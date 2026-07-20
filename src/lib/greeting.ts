/**
 * Cheeky time-of-day greeting for the Living Room hub (Phase 9D,
 * 2026-07-20) — finer-grained than `DayPeriod` (dawn/day/dusk/night, which
 * exists for the art/palette in 4 broad chunks): this wants natural
 * "good morning" / "still up?" phrasing, so it buckets the local hour on
 * its own terms instead.
 */

const GREETINGS: { maxHour: number; phrase: string }[] = [
  { maxHour: 5, phrase: "Still up?" },
  { maxHour: 8, phrase: "Up early?" },
  { maxHour: 12, phrase: "Good morning" },
  { maxHour: 17, phrase: "Good afternoon" },
  { maxHour: 21, phrase: "Good evening" },
  { maxHour: 24, phrase: "Still up?" },
];

/** Buckets a 0-23 local hour into a cheeky greeting phrase (no name/punctuation). */
export function greetingPhraseFromHour(hour: number): string {
  const bucket = GREETINGS.find((g) => hour < g.maxHour);
  return bucket?.phrase ?? "Hi";
}

/** Convenience wrapper over `greetingPhraseFromHour` for a `Date` (local clock). */
export function getGreetingPhrase(reference: Date = new Date()): string {
  return greetingPhraseFromHour(reference.getHours());
}
