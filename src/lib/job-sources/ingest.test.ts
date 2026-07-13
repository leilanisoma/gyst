import { describe, expect, it } from "vitest";
import { ingestNormalizedJob } from "./ingest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import type { NormalizedJob } from "./types";

const USER_ID = "user-1";

const job: NormalizedJob = {
  externalId: "ext-1",
  companyName: "Acme Corp",
  title: "Business Operations Intern",
  location: "Remote",
  description: "Support the ops team.",
  url: "https://example.com/jobs/ext-1",
  postedAt: "2026-07-01T00:00:00.000Z",
  deadline: null,
  roleFamily: "product_ops_business_ops",
  isSwe: false,
  isFinance: false,
};

function makeDb() {
  const db = new FakeSupabase();
  db.tables.preferences = [{ id: USER_ID, recruiting_preferences: { target_grad_year: 2027 } }];
  return db;
}

describe("ingestNormalizedJob", () => {
  it("creates a company, opportunity, job score, and a 'discovered' application on first sight", async () => {
    const db = makeDb();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await ingestNormalizedJob(db as any, USER_ID, "greenhouse", job);

    expect(result).toBe("created");
    expect(db.tables.companies).toHaveLength(1);
    expect(db.tables.companies![0].name).toBe("Acme Corp");

    expect(db.tables.opportunities).toHaveLength(1);
    const opportunity = db.tables.opportunities![0];
    expect(opportunity).toMatchObject({
      source: "greenhouse",
      external_id: "ext-1",
      title: "Business Operations Intern",
    });
    expect(opportunity.last_seen_at).toBeTruthy();

    expect(db.tables.job_scores).toHaveLength(1);
    expect(db.tables.job_scores![0]).toMatchObject({ excluded: false });

    expect(db.tables.applications).toHaveLength(1);
    expect(db.tables.applications![0].stage).toBe("discovered");

    expect(db.tables.application_events).toHaveLength(1);
    expect(db.tables.application_events![0]).toMatchObject({ from_stage: null, to_stage: "discovered" });
  });

  it("excludes a pure-SWE posting via the same hard-exclusion scoring the manual capture path uses", async () => {
    const db = makeDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ingestNormalizedJob(db as any, USER_ID, "greenhouse", { ...job, isSwe: true });

    expect(db.tables.job_scores![0]).toMatchObject({ excluded: true, total_score: 0 });
  });

  it("re-ingesting the same posting updates last_seen_at instead of creating a duplicate", async () => {
    const db = makeDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ingestNormalizedJob(db as any, USER_ID, "greenhouse", job);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const second = await ingestNormalizedJob(db as any, USER_ID, "greenhouse", job);

    expect(second).toBe("updated");
    expect(db.tables.opportunities).toHaveLength(1);
    expect(db.tables.applications).toHaveLength(1);
  });

  it("re-activates a previously expired opportunity if the source sees it again", async () => {
    const db = makeDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ingestNormalizedJob(db as any, USER_ID, "greenhouse", job);
    db.tables.opportunities![0].active = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await ingestNormalizedJob(db as any, USER_ID, "greenhouse", job);

    expect(result).toBe("updated");
    expect(db.tables.opportunities![0].active).toBe(true);
  });
});
