export type Energy = "low" | "medium" | "high";
export type Mood = "great" | "okay" | "low" | "rough";
export type Stress = "low" | "medium" | "high";
export type SleepPerception = "great" | "okay" | "poor";

export const ENERGY_LEVELS: Energy[] = ["low", "medium", "high"];
export const MOODS: Mood[] = ["great", "okay", "low", "rough"];
export const STRESS_LEVELS: Stress[] = ["low", "medium", "high"];
export const SLEEP_PERCEPTIONS: SleepPerception[] = ["great", "okay", "poor"];

export type CheckIn = {
  id: string;
  check_in_date: string;
  mood: Mood | null;
  energy: Energy | null;
  stress: Stress | null;
  sleep_perception: SleepPerception | null;
  capacity_minutes: number | null;
  note: string | null;
};

const DEFAULT_CAPACITY_MINUTES: Record<Energy, number> = {
  low: 90,
  medium: 180,
  high: 240,
};

/** Suggested daily focus capacity for an energy level. A starting point, not enforced. */
export function defaultCapacityMinutes(energy: Energy): number {
  return DEFAULT_CAPACITY_MINUTES[energy];
}
