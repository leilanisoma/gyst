import { afterEach, describe, expect, it, vi } from "vitest";
import { greenhouseAdapter } from "./greenhouse";
import fixture from "./fixtures/greenhouse-jobs.json";

const config = { slug: "example", companyName: "Example Co" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("greenhouseAdapter.discover", () => {
  it("fetches the board's jobs and keeps only internship titles", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fixture,
    });
    vi.stubGlobal("fetch", fetchMock);

    const raw = await greenhouseAdapter.discover(config);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://boards-api.greenhouse.io/v1/boards/example/jobs?content=true",
    );
    expect(raw.map((r) => r.externalId)).toEqual(["1001", "1002"]);
  });

  it('does not match "International" as an internship title', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture });
    vi.stubGlobal("fetch", fetchMock);

    const raw = await greenhouseAdapter.discover(config);

    expect(raw.map((r) => r.externalId)).not.toContain("1004");
  });

  it("throws when the board is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(greenhouseAdapter.discover(config)).rejects.toThrow("404");
  });

  it("requires a slug", async () => {
    await expect(greenhouseAdapter.discover({})).rejects.toThrow('missing "slug"');
  });
});

describe("greenhouseAdapter.normalize", () => {
  it("normalizes a raw job and strips HTML from the description", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture });
    vi.stubGlobal("fetch", fetchMock);
    const [rawOps] = await greenhouseAdapter.discover(config);

    const normalized = greenhouseAdapter.normalize(rawOps, config);
    expect(normalized).toMatchObject({
      externalId: "1001",
      companyName: "Example Co",
      title: "Business Operations Intern, Summer 2027",
      location: "San Francisco, CA",
      url: "https://careers.example.com/positions/1001",
      roleFamily: "product_ops_business_ops",
      isSwe: false,
    });
    expect(normalized.description).toBe("Support the ops team.\nRequires Excel.");
  });

  it("classifies a software engineering internship as isSwe", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => fixture });
    vi.stubGlobal("fetch", fetchMock);
    const [, sweJob] = await greenhouseAdapter.discover(config);

    expect(greenhouseAdapter.normalize(sweJob, config).isSwe).toBe(true);
  });
});

describe("greenhouseAdapter.healthCheck", () => {
  it("reports ok when the board endpoint responds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    await expect(greenhouseAdapter.healthCheck(config)).resolves.toEqual({
      ok: true,
      message: "Reachable",
    });
  });

  it("reports not ok on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const health = await greenhouseAdapter.healthCheck(config);
    expect(health.ok).toBe(false);
    expect(health.message).toContain("404");
  });
});
