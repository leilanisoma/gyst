import type { JobSourceAdapter, NormalizedJob, RawJob, SourceConfig, SourceHealth } from "./types";
import { classify } from "./classify";

type LeverConfig = { slug: string; companyName?: string };

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: { location?: string };
  createdAt?: number;
  descriptionBodyPlain?: string;
};

function parseConfig(config: SourceConfig): LeverConfig {
  const slug = typeof config.slug === "string" ? config.slug.trim() : "";
  if (!slug) {
    throw new Error('Lever source config is missing "slug".');
  }
  return {
    slug,
    companyName: typeof config.companyName === "string" ? config.companyName : undefined,
  };
}

function postingsUrl(slug: string): string {
  return `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
}

/** Public Lever postings API — no auth, no ToS restriction on read access (PLAN.md §8 source order #1). */
export const leverAdapter: JobSourceAdapter = {
  id: "lever",

  async discover(config): Promise<RawJob[]> {
    const { slug } = parseConfig(config);
    const res = await fetch(postingsUrl(slug));
    if (!res.ok) {
      throw new Error(`Lever site "${slug}" returned ${res.status}`);
    }
    const postings = (await res.json()) as LeverPosting[];
    return postings
      .filter((posting) => /intern/i.test(posting.text))
      .map((posting) => ({ externalId: posting.id, raw: posting }));
  },

  normalize(rawJob, config): NormalizedJob {
    const { slug, companyName } = parseConfig(config);
    const posting = rawJob.raw as LeverPosting;
    return {
      externalId: rawJob.externalId,
      companyName: companyName ?? slug,
      title: posting.text,
      location: posting.categories?.location?.trim() || null,
      description: posting.descriptionBodyPlain?.trim() || null,
      url: posting.hostedUrl,
      postedAt: posting.createdAt ? new Date(posting.createdAt).toISOString() : null,
      deadline: null,
      ...classify(posting.text),
    };
  },

  async healthCheck(config): Promise<SourceHealth> {
    try {
      const { slug } = parseConfig(config);
      const res = await fetch(postingsUrl(slug));
      if (!res.ok) {
        return { ok: false, message: `Lever site "${slug}" returned ${res.status}` };
      }
      return { ok: true, message: "Reachable" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
    }
  },
};
