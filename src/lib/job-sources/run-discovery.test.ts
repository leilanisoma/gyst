import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "./fixtures/fake-supabase";
import type { JobSourceAdapter, NormalizedJob, RawJob } from "./types";

vi.mock("./registry", () => ({ getAdapter: (id: string) => adapters[id] }));

const adapters: Record<string, JobSourceAdapter> = {};

function job(externalId: string, title = "Business Operations Intern"): NormalizedJob {
  return {
    externalId,
    companyName: "Acme Corp",
    title: `${title} ${externalId}`,
    location: "Remote",
    description: null,
    url: `https://example.com/jobs/${externalId}`,
    postedAt: null,
    deadline: null,
    roleFamily: "product_ops_business_ops",
    isSwe: false,
    isFinance: false,
  };
}

function makeFakeAdapter(rawJobs: RawJob[]): JobSourceAdapter {
  return {
    id: "greenhouse",
    async discover() {
      return rawJobs;
    },
    normalize(raw) {
      return raw.raw as NormalizedJob;
    },
    async healthCheck() {
      return { ok: true, message: "Reachable" };
    },
  };
}

function makeDb() {
  const db = new FakeSupabase();
  db.tables.preferences = [{ id: "user-1", recruiting_preferences: { target_grad_year: 2027 } }];
  return db;
}

const sourceConfig = { id: "sc-1", adapter_id: "greenhouse" as const, label: "Acme board", config: {} };

describe("runDiscoveryForSource", () => {
  it("records a successful run and creates opportunities for every discovered job", async () => {
    const { runDiscoveryForSource } = await import("./run-discovery");
    const db = makeDb();
    adapters.greenhouse = makeFakeAdapter([
      { externalId: "a", raw: job("a") },
      { externalId: "b", raw: job("b") },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary = await runDiscoveryForSource(db as any, "user-1", sourceConfig);

    expect(summary).toMatchObject({ status: "success", itemsFound: 2, itemsCreated: 2, itemsExpired: 0 });
    expect(db.tables.opportunities).toHaveLength(2);
    expect(db.tables.source_runs![0]).toMatchObject({ status: "success", items_found: 2 });
  });

  it("expires an opportunity from this source that a later run no longer sees", async () => {
    const { runDiscoveryForSource } = await import("./run-discovery");
    const db = makeDb();
    adapters.greenhouse = makeFakeAdapter([
      { externalId: "a", raw: job("a") },
      { externalId: "b", raw: job("b") },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await runDiscoveryForSource(db as any, "user-1", sourceConfig);

    adapters.greenhouse = makeFakeAdapter([{ externalId: "a", raw: job("a") }]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary = await runDiscoveryForSource(db as any, "user-1", sourceConfig);

    expect(summary).toMatchObject({ itemsFound: 1, itemsCreated: 0, itemsUpdated: 1, itemsExpired: 1 });
    const stillActive = db.tables.opportunities!.filter((o) => o.active);
    expect(stillActive).toHaveLength(1);
    expect(stillActive[0].external_id).toBe("a");
  });

  it("records a failed run without throwing when the adapter errors", async () => {
    const { runDiscoveryForSource } = await import("./run-discovery");
    const db = makeDb();
    adapters.greenhouse = {
      id: "greenhouse",
      async discover() {
        throw new Error("board unreachable");
      },
      normalize(raw) {
        return raw.raw as NormalizedJob;
      },
      async healthCheck() {
        return { ok: false, message: "board unreachable" };
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary = await runDiscoveryForSource(db as any, "user-1", sourceConfig);

    expect(summary).toMatchObject({ status: "error", error: "board unreachable" });
    expect(db.tables.source_runs![0]).toMatchObject({ status: "error", error: "board unreachable" });
  });
});
