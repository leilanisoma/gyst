export type Energy = "low" | "medium" | "high";
export type Mood = "great" | "okay" | "low" | "rough";
export type Stress = "low" | "medium" | "high";
export type SleepPerception = "great" | "okay" | "poor";
export type AteConsistently = "yes" | "somewhat" | "no" | "prefer_not_to_say";
export type Recovery = "great" | "okay" | "poor";

export const ENERGY_LEVELS: Energy[] = ["low", "medium", "high"];
export const MOODS: Mood[] = ["great", "okay", "low", "rough"];
export const STRESS_LEVELS: Stress[] = ["low", "medium", "high"];
export const SLEEP_PERCEPTIONS: SleepPerception[] = ["great", "okay", "poor"];
export const ATE_CONSISTENTLY_OPTIONS: AteConsistently[] = [
  "yes",
  "somewhat",
  "no",
  "prefer_not_to_say",
];
export const RECOVERY_LEVELS: Recovery[] = ["great", "okay", "poor"];

export type WellnessCheckIn = {
  id: string;
  check_in_date: string;
  energy: Energy | null;
  mood: Mood | null;
  stress: Stress | null;
  sleep_perception: SleepPerception | null;
  ate_consistently: AteConsistently | null;
  recovery: Recovery | null;
  note: string | null;
};

function shiftDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

type TrendField = keyof Pick<
  WellnessCheckIn,
  "energy" | "mood" | "stress" | "sleep_perception" | "ate_consistently" | "recovery"
>;

type TrendRule = {
  field: TrendField;
  signalValues: readonly string[];
  describe: (count: number, logged: number) => string;
};

/**
 * Neutral, descriptive-only phrasing (PLAN.md §11: observations like "sleep
 * was shorter on three nights," never causal or diagnostic language).
 * Threshold of 2+ days keeps a single rough day from reading as a "trend"
 * (PLAN.md §3 anxiety-aware UX).
 */
const TREND_RULES: TrendRule[] = [
  {
    field: "energy",
    signalValues: ["low"],
    describe: (count, logged) =>
      `Energy was logged as low on ${count} of the ${logged} days you checked in this week.`,
  },
  {
    field: "mood",
    signalValues: ["low", "rough"],
    describe: (count, logged) =>
      `Mood leaned low on ${count} of the ${logged} days you checked in this week.`,
  },
  {
    field: "stress",
    signalValues: ["high"],
    describe: (count, logged) =>
      `Stress was logged as high on ${count} of the ${logged} days you checked in this week.`,
  },
  {
    field: "sleep_perception",
    signalValues: ["poor"],
    describe: (count, logged) =>
      `Sleep felt short or poor on ${count} of the ${logged} days you checked in this week.`,
  },
  {
    field: "ate_consistently",
    signalValues: ["no", "somewhat"],
    describe: (count, logged) =>
      `Eating felt inconsistent on ${count} of the ${logged} days you checked in this week.`,
  },
  {
    field: "recovery",
    signalValues: ["poor"],
    describe: (count, logged) =>
      `Recovery felt low on ${count} of the ${logged} days you checked in this week.`,
  },
];

const MIN_OBSERVATION_COUNT = 2;

/**
 * Descriptive-only weekly observations from the trailing 7 days (inclusive
 * of `today`). Returns an empty array when there isn't a repeated (2+ day)
 * pattern for any field — a single off day never becomes a "trend."
 */
export function weeklyTrendObservations(
  checkIns: WellnessCheckIn[],
  today: string,
): string[] {
  const start = shiftDateString(today, -6);
  const inWindow = checkIns.filter(
    (checkIn) => checkIn.check_in_date >= start && checkIn.check_in_date <= today,
  );

  const observations: string[] = [];
  for (const rule of TREND_RULES) {
    const logged = inWindow.filter((checkIn) => checkIn[rule.field] !== null);
    const count = logged.filter((checkIn) =>
      rule.signalValues.includes(checkIn[rule.field] as string),
    ).length;
    if (count >= MIN_OBSERVATION_COUNT) {
      observations.push(rule.describe(count, logged.length));
    }
  }
  return observations;
}
