import type { RoleFamily } from "@/lib/recruiting";

/** The adapters this app currently knows how to run. Mirrors the `source_configs.adapter_id` check constraint. */
export type AdapterId = "greenhouse" | "lever" | "curated_feed";

/** Per-source-config settings, shape depends on `adapter_id`. Stored as `source_configs.config`. */
export type SourceConfig = Record<string, unknown>;

/** One posting exactly as an adapter's API returned it, before normalization. */
export type RawJob = {
  externalId: string;
  raw: unknown;
};

/** A posting reshaped into the fields `opportunities` needs, still adapter-owned classification. */
export type NormalizedJob = {
  externalId: string;
  companyName: string;
  title: string;
  location: string | null;
  description: string | null;
  url: string;
  postedAt: string | null;
  deadline: string | null;
  roleFamily: RoleFamily;
  isSwe: boolean;
  isFinance: boolean;
};

export type SourceHealth = {
  ok: boolean;
  message: string;
};

/**
 * Legal, replaceable source contract (PLAN.md §8). Every adapter discovers
 * raw postings, normalizes them into GYST's shape, and reports whether it's
 * currently reachable — so a broken source fails visibly (via `source_runs`)
 * instead of silently returning nothing.
 */
export interface JobSourceAdapter {
  id: AdapterId;
  discover(config: SourceConfig): Promise<RawJob[]>;
  normalize(raw: RawJob, config: SourceConfig): NormalizedJob;
  healthCheck(config: SourceConfig): Promise<SourceHealth>;
}
