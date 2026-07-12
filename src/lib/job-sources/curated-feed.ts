import type { JobSourceAdapter, NormalizedJob, RawJob, SourceConfig, SourceHealth } from "./types";
import type { RoleFamily } from "@/lib/recruiting";
import { classify } from "./classify";

/**
 * Pitt CSC / Simplify's internship listing repo. Public, unauthenticated,
 * generated specifically for programmatic consumption by tools like this
 * one (see `.github/scripts/listings.json` in the repo and third-party
 * consumers such as swelist.com) — reviewed under PLAN.md §8's "terms
 * review" requirement before use. The repo is renamed each cycle; update
 * `feedUrl` in the source_config once a "SummerYYYY-Internships" repo for
 * the current target grad year exists.
 */
const DEFAULT_FEED_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json";
const DEFAULT_CATEGORIES = ["Product"];
const DEFAULT_TERMS = ["Summer 2027"];

/** Category -> role family fallback when title keywords alone classify as "other". */
const CATEGORY_ROLE_FAMILY: Record<string, RoleFamily> = {
  Product: "product_management",
  "Product Management": "product_management",
  "AI/ML/Data": "ai_adjacent_non_swe",
  "Data Science, AI & Machine Learning": "ai_adjacent_non_swe",
};

const CATEGORY_IS_FINANCE = new Set(["Quant", "Quantitative Finance"]);

type CuratedFeedConfig = {
  feedUrl: string;
  categories: string[];
  terms: string[];
};

type CuratedFeedItem = {
  id: string;
  category: string;
  company_name: string;
  title: string;
  active: boolean;
  terms: string[];
  date_posted: number;
  url: string;
  locations?: string[];
};

function parseConfig(config: SourceConfig): CuratedFeedConfig {
  return {
    feedUrl: typeof config.feedUrl === "string" && config.feedUrl ? config.feedUrl : DEFAULT_FEED_URL,
    categories: Array.isArray(config.categories) && config.categories.length > 0
      ? (config.categories as string[])
      : DEFAULT_CATEGORIES,
    terms: Array.isArray(config.terms) && config.terms.length > 0
      ? (config.terms as string[])
      : DEFAULT_TERMS,
  };
}

export const curatedFeedAdapter: JobSourceAdapter = {
  id: "curated_feed",

  async discover(config): Promise<RawJob[]> {
    const { feedUrl, categories, terms } = parseConfig(config);
    const res = await fetch(feedUrl);
    if (!res.ok) {
      throw new Error(`Curated feed returned ${res.status}`);
    }
    const items = (await res.json()) as CuratedFeedItem[];
    return items
      .filter(
        (item) =>
          item.active &&
          categories.includes(item.category) &&
          item.terms?.some((term) => terms.includes(term)),
      )
      .map((item) => ({ externalId: item.id, raw: item }));
  },

  normalize(rawJob): NormalizedJob {
    const item = rawJob.raw as CuratedFeedItem;
    const classification = classify(item.title);
    const roleFamily =
      classification.roleFamily === "other" && CATEGORY_ROLE_FAMILY[item.category]
        ? CATEGORY_ROLE_FAMILY[item.category]
        : classification.roleFamily;
    const isFinance = classification.isFinance || CATEGORY_IS_FINANCE.has(item.category);

    return {
      externalId: rawJob.externalId,
      companyName: item.company_name,
      title: item.title,
      location: item.locations?.join("; ") || null,
      description: null,
      url: item.url,
      postedAt: item.date_posted ? new Date(item.date_posted * 1000).toISOString() : null,
      deadline: null,
      roleFamily,
      isSwe: classification.isSwe,
      isFinance,
    };
  },

  async healthCheck(config): Promise<SourceHealth> {
    try {
      const { feedUrl } = parseConfig(config);
      const res = await fetch(feedUrl, { method: "HEAD" });
      if (!res.ok) {
        return { ok: false, message: `Feed returned ${res.status}` };
      }
      return { ok: true, message: "Reachable" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
    }
  },
};
