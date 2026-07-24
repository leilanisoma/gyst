import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type Flow = "none" | "spotting" | "light" | "medium" | "heavy";
export const FLOW_LEVELS: Flow[] = ["none", "spotting", "light", "medium", "heavy"];

export type Symptom =
  | "cramps"
  | "headache"
  | "fatigue"
  | "bloating"
  | "mood_change"
  | "other";
export const ALLOWED_SYMPTOMS: Symptom[] = [
  "cramps",
  "headache",
  "fatigue",
  "bloating",
  "mood_change",
  "other",
];

export type CycleObservationSource = "manual_entry" | "manual_csv";

/** Fertility-monitor hormone readings, tested every other day rather than daily. */
export type HormoneReadings = {
  on_period: boolean | null;
  lh: number | null;
  e3g: number | null;
  pdg: number | null;
  fsh: number | null;
};

export type CycleObservation = HormoneReadings & {
  id: string;
  observation_date: string;
  flow: Flow | null;
  symptoms: string[];
  note: string | null;
  source: CycleObservationSource;
};

export type ParsedCycleCsvRow = {
  observation_date: string;
  flow: Flow | null;
  symptoms: Symptom[];
  note: string | null;
};

/** Manual single-day entry — the hormone readings, not the CSV import path. */
export const cycleObservationEntrySchema = z.object({
  observation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  on_period: z.boolean().nullable().optional(),
  lh: z.number().min(0).nullable().optional(),
  e3g: z.number().min(0).nullable().optional(),
  pdg: z.number().min(0).nullable().optional(),
  fsh: z.number().min(0).nullable().optional(),
});

export type CycleObservationEntry = z.infer<typeof cycleObservationEntrySchema>;

export type CycleCsvParseResult = {
  rows: ParsedCycleCsvRow[];
  errors: string[];
};

/** Minimal RFC4180-ish splitter: double-quoted fields, `""` as an escaped quote. Good enough for a hand-exported/hand-edited personal CSV, not a general parser. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Manual/CSV import path PLAN.md §8 requires in place of assuming a Mira
 * (or any third-party) API/scrape: `date,flow,symptoms,note` header,
 * `symptoms` semicolon-separated from `ALLOWED_SYMPTOMS`. Tolerant of
 * blank/missing optional columns; a malformed row is skipped and reported
 * rather than guessed at or silently dropped.
 */
export function parseCycleCsv(csvText: string): CycleCsvParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], errors: [] };
  }

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const dateIdx = header.indexOf("date");
  const flowIdx = header.indexOf("flow");
  const symptomsIdx = header.indexOf("symptoms");
  const noteIdx = header.indexOf("note");

  if (dateIdx === -1) {
    return { rows: [], errors: ["Missing required 'date' column in the header row."] };
  }

  const rows: ParsedCycleCsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const cols = splitCsvLine(lines[i]);

    const dateRaw = cols[dateIdx]?.trim() ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      errors.push(`Line ${lineNumber}: invalid date "${dateRaw}" (expected YYYY-MM-DD).`);
      continue;
    }

    let flow: Flow | null = null;
    if (flowIdx >= 0) {
      const flowRaw = cols[flowIdx]?.trim().toLowerCase();
      if (flowRaw) {
        if (!FLOW_LEVELS.includes(flowRaw as Flow)) {
          errors.push(`Line ${lineNumber}: unknown flow value "${flowRaw}".`);
          continue;
        }
        flow = flowRaw as Flow;
      }
    }

    let symptoms: Symptom[] = [];
    if (symptomsIdx >= 0) {
      const symptomsRaw = cols[symptomsIdx]?.trim();
      if (symptomsRaw) {
        const tokens = symptomsRaw
          .split(";")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const invalid = tokens.filter(
          (token) => !ALLOWED_SYMPTOMS.includes(token as Symptom),
        );
        if (invalid.length > 0) {
          errors.push(
            `Line ${lineNumber}: unknown symptom(s) "${invalid.join(", ")}".`,
          );
          continue;
        }
        symptoms = tokens as Symptom[];
      }
    }

    const note = noteIdx >= 0 ? cols[noteIdx]?.trim() || null : null;

    rows.push({ observation_date: dateRaw, flow, symptoms, note });
  }

  return { rows, errors };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function upsertCycleObservations(
  supabase: SupabaseServerClient,
  userId: string,
  rows: ParsedCycleCsvRow[],
  source: CycleObservationSource,
): Promise<ActionResult & { count?: number }> {
  const payload = rows.map((row) => ({
    user_id: userId,
    observation_date: row.observation_date,
    flow: row.flow,
    symptoms: row.symptoms,
    note_encrypted: row.note ? encryptSecret(row.note) : null,
    source,
  }));

  const { error } = await supabase
    .from("cycle_observations")
    .upsert(payload, { onConflict: "user_id,observation_date" });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, count: payload.length };
}

export async function listCycleObservations(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<CycleObservation[]> {
  const { data } = await supabase
    .from("cycle_observations")
    .select(
      "id, observation_date, flow, symptoms, note_encrypted, source, on_period, lh, e3g, pdg, fsh",
    )
    .eq("user_id", userId)
    .order("observation_date", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    observation_date: row.observation_date,
    flow: row.flow as Flow | null,
    symptoms: row.symptoms,
    note: row.note_encrypted ? decryptSecret(row.note_encrypted) : null,
    source: row.source as CycleObservationSource,
    on_period: row.on_period,
    lh: row.lh,
    e3g: row.e3g,
    pdg: row.pdg,
    fsh: row.fsh,
  }));
}

/**
 * Manual single-day entry for fertility-monitor hormone readings (LH, E3G,
 * PdG, FSH — tested every other day) plus a simple period on/off flag.
 * Separate from `upsertCycleObservations` (the CSV import path) since the
 * payload here only ever touches these five columns — an upsert on
 * conflict only sets the columns present in the object, so this can't
 * clobber flow/symptoms/note that a CSV import already stored for the same
 * date.
 */
export async function upsertCycleObservationEntry(
  supabase: SupabaseServerClient,
  userId: string,
  entry: CycleObservationEntry,
): Promise<ActionResult> {
  const { error } = await supabase.from("cycle_observations").upsert(
    {
      user_id: userId,
      observation_date: entry.observation_date,
      on_period: entry.on_period ?? null,
      lh: entry.lh ?? null,
      e3g: entry.e3g ?? null,
      pdg: entry.pdg ?? null,
      fsh: entry.fsh ?? null,
    },
    { onConflict: "user_id,observation_date" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteCycleObservation(
  supabase: SupabaseServerClient,
  userId: string,
  id: string,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("cycle_observations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Separate deletion control from `health_daily_summaries` per PLAN.md §11 ("separate permissions and deletion controls"). */
export async function deleteAllCycleObservations(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("cycle_observations")
    .delete()
    .eq("user_id", userId);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
