import { afterEach, describe, expect, it, vi } from "vitest";
import { leverAdapter } from "./lever";
import fixture from "./fixtures/lever-postings.json";

const config = { slug: "example", companyName: "Example Co" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("leverAdapter.discover", () => {
  it("fetches postings and keeps only internship titles", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture });
    vi.stubGlobal("fetch", fetchMock);

    const raw = await leverAdapter.discover(config);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.lever.co/v0/postings/example?mode=json",
    );
    expect(raw.map((r) => r.externalId)).toEqual(["aaaa-1111", "bbbb-2222"]);
  });

  it('does not match "International" as an internship title', async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture }));

    const raw = await leverAdapter.discover(config);

    expect(raw.map((r) => r.externalId)).not.toContain("dddd-4444");
  });

  it("requires a slug", async () => {
    await expect(leverAdapter.discover({})).rejects.toThrow('missing "slug"');
  });
});

describe("leverAdapter.normalize", () => {
  it("normalizes a posting into GYST's shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture });
    vi.stubGlobal("fetch", fetchMock);
    const [growthJob, mlJob] = await leverAdapter.discover(config);

    expect(leverAdapter.normalize(growthJob, config)).toMatchObject({
      externalId: "aaaa-1111",
      companyName: "Example Co",
      title: "Growth Marketing Intern, Summer 2027",
      location: "Austin, TX",
      description: "Drive growth experiments.",
      url: "https://jobs.lever.co/example/aaaa-1111",
      roleFamily: "growth_business_development",
      isSwe: false,
    });
    expect(leverAdapter.normalize(mlJob, config).isSwe).toBe(true);
  });
});

describe("leverAdapter.healthCheck", () => {
  it("reports ok when the site responds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    await expect(leverAdapter.healthCheck(config)).resolves.toEqual({
      ok: true,
      message: "Reachable",
    });
  });
});
