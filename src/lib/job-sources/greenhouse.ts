import type { JobSourceAdapter, NormalizedJob, RawJob, SourceConfig, SourceHealth } from "./types";
import { classify, isInternshipTitle } from "./classify";
import { stripHtml } from "./html";

type GreenhouseConfig = { slug: string; companyName?: string };

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  first_published?: string;
  content?: string;
};

function parseConfig(config: SourceConfig): GreenhouseConfig {
  const slug = typeof config.slug === "string" ? config.slug.trim() : "";
  if (!slug) {
    throw new Error('Greenhouse source config is missing "slug".');
  }
  return {
    slug,
    companyName: typeof config.companyName === "string" ? config.companyName : undefined,
  };
}

function boardUrl(slug: string): string {
  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}`;
}

/** Public Greenhouse boards API — no auth, no ToS restriction on read access (PLAN.md §8 source order #1). */
export const greenhouseAdapter: JobSourceAdapter = {
  id: "greenhouse",

  async discover(config): Promise<RawJob[]> {
    const { slug } = parseConfig(config);
    const res = await fetch(`${boardUrl(slug)}/jobs?content=true`);
    if (!res.ok) {
      throw new Error(`Greenhouse board "${slug}" returned ${res.status}`);
    }
    const data = (await res.json()) as { jobs: GreenhouseJob[] };
    return data.jobs
      .filter((job) => isInternshipTitle(job.title))
      .map((job) => ({ externalId: String(job.id), raw: job }));
  },

  normalize(rawJob, config): NormalizedJob {
    const { slug, companyName } = parseConfig(config);
    const job = rawJob.raw as GreenhouseJob;
    return {
      externalId: rawJob.externalId,
      companyName: companyName ?? slug,
      title: job.title,
      location: job.location?.name?.trim() || null,
      description: job.content ? stripHtml(job.content) : null,
      url: job.absolute_url,
      postedAt: job.first_published ?? null,
      deadline: null,
      ...classify(job.title),
    };
  },

  async healthCheck(config): Promise<SourceHealth> {
    try {
      const { slug } = parseConfig(config);
      const res = await fetch(boardUrl(slug));
      if (!res.ok) {
        return { ok: false, message: `Board "${slug}" returned ${res.status}` };
      }
      return { ok: true, message: "Reachable" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
    }
  },
};
