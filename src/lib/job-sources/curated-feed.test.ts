import { afterEach, describe, expect, it, vi } from "vitest";
import { curatedFeedAdapter } from "./curated-feed";
import fixture from "./fixtures/curated-feed-listings.json";

const config = { categories: ["Product"], terms: ["Summer 2027"] };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("curatedFeedAdapter.discover", () => {
  it("keeps only active listings matching the configured category and term", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture }));

    const raw = await curatedFeedAdapter.discover(config);

    // feed-2 wrong term, feed-3 wrong category, feed-4 inactive — only feed-1 survives.
    expect(raw.map((r) => r.externalId)).toEqual(["feed-1"]);
  });

  it("falls back to the default feed URL and filters when config is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture });
    vi.stubGlobal("fetch", fetchMock);

    await curatedFeedAdapter.discover({});

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("SimplifyJobs/Summer2026-Internships"),
    );
  });
});

describe("curatedFeedAdapter.normalize", () => {
  it("normalizes a listing and falls back to the category for role family", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture }));
    const [raw] = await curatedFeedAdapter.discover(config);

    expect(curatedFeedAdapter.normalize(raw, config)).toMatchObject({
      externalId: "feed-1",
      companyName: "Acme Corp",
      title: "Product Management Intern",
      location: "Remote in USA",
      url: "https://example.com/jobs/feed-1",
      roleFamily: "product_management",
      isSwe: false,
      isFinance: false,
    });
  });
});

describe("curatedFeedAdapter.healthCheck", () => {
  it("reports ok when the feed responds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    await expect(curatedFeedAdapter.healthCheck(config)).resolves.toEqual({
      ok: true,
      message: "Reachable",
    });
  });
});
