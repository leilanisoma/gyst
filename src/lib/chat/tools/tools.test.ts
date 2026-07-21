import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/lib/test/fake-supabase";
import { getRegisteredTool } from "./types";
import "./index";

function makeContext(
  db: FakeSupabase,
  embedText = vi.fn(async () => [0.1, 0.2, 0.3]),
) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: db as any,
    userId: "user-1",
    embedText,
    conversationId: null,
    sourceMessageId: null,
  };
}

describe("get_tasks", () => {
  it("filters by status and area and respects the limit", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [
      {
        id: "t1",
        user_id: "user-1",
        title: "A",
        status: "not_started",
        area: "school",
        due_date: "2026-01-01",
      },
      {
        id: "t2",
        user_id: "user-1",
        title: "B",
        status: "completed",
        area: "school",
        due_date: "2026-01-02",
      },
      {
        id: "t3",
        user_id: "user-1",
        title: "C",
        status: "not_started",
        area: "recruiting",
        due_date: "2026-01-03",
      },
      {
        id: "t4",
        user_id: "other-user",
        title: "D",
        status: "not_started",
        area: "school",
        due_date: "2026-01-04",
      },
    ];
    const tool = getRegisteredTool("get_tasks")!;
    const parsed = tool.argsSchema.parse({
      status: "not_started",
      area: "school",
    });
    const result = (await tool.execute(makeContext(db), parsed)) as {
      tasks: { id: string }[];
    };
    expect(result.tasks.map((t) => t.id)).toEqual(["t1"]);
  });
});

describe("get_schedule", () => {
  it("returns events within range (excluding deleted) plus active recurring commitments", async () => {
    const db = new FakeSupabase();
    db.tables.events = [
      {
        id: "e1",
        user_id: "user-1",
        title: "In range",
        start_at: "2026-07-16T10:00:00Z",
        deleted_at: null,
      },
      {
        id: "e2",
        user_id: "user-1",
        title: "Deleted",
        start_at: "2026-07-16T11:00:00Z",
        deleted_at: "2026-07-15T00:00:00Z",
      },
      {
        id: "e3",
        user_id: "user-1",
        title: "Out of range",
        start_at: "2026-08-01T10:00:00Z",
        deleted_at: null,
      },
    ];
    db.tables.recurring_schedules = [
      {
        id: "r1",
        user_id: "user-1",
        title: "Fencing",
        active: true,
        day_of_week: 2,
      },
      {
        id: "r2",
        user_id: "user-1",
        title: "Old class",
        active: false,
        day_of_week: 3,
      },
    ];
    const tool = getRegisteredTool("get_schedule")!;
    const parsed = tool.argsSchema.parse({
      startDate: "2026-07-15",
      endDate: "2026-07-20",
    });
    const result = (await tool.execute(makeContext(db), parsed)) as {
      events: { id: string }[];
      recurringCommitments: { id: string }[];
    };
    expect(result.events.map((e) => e.id)).toEqual(["e1"]);
    expect(result.recurringCommitments.map((r) => r.id)).toEqual(["r1"]);
  });
});

describe("get_school_overview", () => {
  it("excludes dismissed assessments and submitted assignments", async () => {
    const db = new FakeSupabase();
    db.tables.courses = [
      { id: "c1", user_id: "user-1", title: "CS101", active: true },
    ];
    db.tables.assessments = [
      {
        id: "a1",
        user_id: "user-1",
        course_id: "c1",
        title: "Midterm",
        dismissed_at: null,
      },
      {
        id: "a2",
        user_id: "user-1",
        course_id: "c1",
        title: "Old quiz",
        dismissed_at: "2026-01-01T00:00:00Z",
      },
    ];
    db.tables.assignments = [
      {
        id: "as1",
        user_id: "user-1",
        course_id: "c1",
        title: "HW1",
        submitted: false,
      },
      {
        id: "as2",
        user_id: "user-1",
        course_id: "c1",
        title: "HW0",
        submitted: true,
      },
    ];
    const tool = getRegisteredTool("get_school_overview")!;
    const parsed = tool.argsSchema.parse({});
    const result = (await tool.execute(makeContext(db), parsed)) as {
      assessments: { id: string }[];
      assignments: { id: string }[];
    };
    expect(result.assessments.map((a) => a.id)).toEqual(["a1"]);
    expect(result.assignments.map((a) => a.id)).toEqual(["as1"]);
  });
});

describe("get_recruiting_overview", () => {
  it("filters applications by stage and resolves related opportunities/companies/contacts", async () => {
    const db = new FakeSupabase();
    db.tables.applications = [
      {
        id: "app1",
        user_id: "user-1",
        opportunity_id: "opp1",
        stage: "applied",
      },
      { id: "app2", user_id: "user-1", opportunity_id: "opp2", stage: "saved" },
    ];
    db.tables.opportunities = [
      { id: "opp1", company_id: "co1", title: "PM Intern" },
      { id: "opp2", company_id: "co2", title: "Other" },
    ];
    db.tables.companies = [
      { id: "co1", name: "Acme" },
      { id: "co2", name: "Other Co" },
    ];
    db.tables.contacts = [
      {
        id: "ct1",
        user_id: "user-1",
        name: "Alum",
        next_contact_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "ct2",
        user_id: "user-1",
        name: "No follow-up",
        next_contact_at: null,
      },
    ];
    const tool = getRegisteredTool("get_recruiting_overview")!;
    const parsed = tool.argsSchema.parse({ stage: "applied" });
    const result = (await tool.execute(makeContext(db), parsed)) as {
      applications: { id: string }[];
      opportunities: { id: string }[];
      companies: { id: string }[];
      contactsDueForFollowUp: { id: string }[];
    };
    expect(result.applications.map((a) => a.id)).toEqual(["app1"]);
    expect(result.opportunities.map((o) => o.id)).toEqual(["opp1"]);
    expect(result.companies.map((c) => c.id)).toEqual(["co1"]);
    expect(result.contactsDueForFollowUp.map((c) => c.id)).toEqual(["ct1"]);
  });
});

describe("get_documents", () => {
  it("filters by kind", async () => {
    const db = new FakeSupabase();
    db.tables.documents = [
      { id: "d1", user_id: "user-1", kind: "resume", title: "Resume v3" },
      { id: "d2", user_id: "user-1", kind: "transcript", title: "Transcript" },
    ];
    const tool = getRegisteredTool("get_documents")!;
    const parsed = tool.argsSchema.parse({ kind: "resume" });
    const result = (await tool.execute(makeContext(db), parsed)) as {
      documents: { id: string }[];
    };
    expect(result.documents.map((d) => d.id)).toEqual(["d1"]);
  });
});

describe("save_memory", () => {
  let db: FakeSupabase;
  beforeEach(() => {
    db = new FakeSupabase();
  });

  it("saves a pending memory item with the given trigger as its source, embedded", async () => {
    const embedText = vi.fn(async () => [0.5, 0.6]);
    const tool = getRegisteredTool("save_memory")!;
    const parsed = tool.argsSchema.parse({
      text: "Prefers PM roles over SWE",
      kind: "preference",
      trigger: "explicit",
    });
    const result = (await tool.execute(makeContext(db, embedText), parsed)) as {
      status: string;
    };
    expect(result.status).toBe("pending");
    expect(embedText).toHaveBeenCalledWith("Prefers PM roles over SWE");
    expect(db.tables.memory_items![0]).toMatchObject({
      status: "pending",
      source: "explicit",
      kind: "preference",
      // pgvector's wire format is a text literal, not a JSON array (src/lib/chat/embedding.ts).
      embedding: "[0.5,0.6]",
    });
  });

  it("still saves the memory item even if embedding fails", async () => {
    const embedText = vi.fn(async () => {
      throw new Error("embedding API down");
    });
    const tool = getRegisteredTool("save_memory")!;
    const parsed = tool.argsSchema.parse({
      text: "Wants summer 2027 internships",
      kind: "goal",
      trigger: "model_suggested",
    });
    const result = (await tool.execute(makeContext(db, embedText), parsed)) as {
      status: string;
    };
    expect(result.status).toBe("pending");
    expect(db.tables.memory_items).toHaveLength(1);
  });
});

describe("propose_action", () => {
  it("only creates a preview row for a valid action, never a real write", async () => {
    const db = new FakeSupabase();
    db.tables.tasks = [];
    const tool = getRegisteredTool("propose_action")!;
    const parsed = tool.argsSchema.parse({
      actionType: "create_task",
      arguments: { title: "Follow up with recruiter" },
      preview: "Create task 'Follow up with recruiter'",
    });
    const result = (await tool.execute(makeContext(db), parsed)) as {
      status: string;
    };
    expect(result.status).toBe("proposed");
    expect(db.tables.tasks).toHaveLength(0);
    expect(db.tables.assistant_actions).toHaveLength(1);
    expect(db.tables.assistant_actions![0].status).toBe("proposed");
  });

  it("rejects invalid arguments before ever creating a row", async () => {
    const db = new FakeSupabase();
    const tool = getRegisteredTool("propose_action")!;
    const parsed = tool.argsSchema.parse({
      actionType: "create_task",
      arguments: { title: "" }, // empty title fails CreateTaskActionSchema
      preview: "Create task",
    });
    const result = (await tool.execute(makeContext(db), parsed)) as {
      status: string;
      error: string;
    };
    expect(result.status).toBe("rejected");
    expect(db.tables.assistant_actions ?? []).toHaveLength(0);
  });
});

describe("search_memory", () => {
  it("embeds the query and returns whatever the match_memory_items RPC returns", async () => {
    const db = new FakeSupabase();
    const matches = [
      {
        id: "m1",
        text: "Prefers PM roles",
        kind: "preference",
        confidence: 0.9,
        similarity: 0.95,
      },
    ];
    db.rpcHandlers.match_memory_items = (args) => {
      expect(args.p_user_id).toBe("user-1");
      // pgvector's wire format is a text literal, not a JSON array (src/lib/chat/embedding.ts).
      expect(args.p_query_embedding).toBe("[0.1,0.2,0.3]");
      return { data: matches, error: null };
    };
    const tool = getRegisteredTool("search_memory")!;
    const parsed = tool.argsSchema.parse({ query: "what roles does she like" });
    const result = (await tool.execute(makeContext(db), parsed)) as {
      matches: unknown[];
    };
    expect(result.matches).toEqual(matches);
  });
});

describe("search_documents", () => {
  it("resolves matched chunks' document metadata for citations", async () => {
    const db = new FakeSupabase();
    db.tables.documents = [{ id: "doc1", title: "Resume v3", kind: "resume" }];
    db.rpcHandlers.match_document_chunks = () => ({
      data: [
        {
          id: "c1",
          document_id: "doc1",
          content: "Led a team of 5",
          page: 1,
          similarity: 0.9,
        },
      ],
      error: null,
    });
    const tool = getRegisteredTool("search_documents")!;
    const parsed = tool.argsSchema.parse({ query: "leadership experience" });
    const result = (await tool.execute(makeContext(db), parsed)) as {
      matches: unknown[];
      documents: { id: string }[];
    };
    expect(result.matches).toHaveLength(1);
    expect(result.documents.map((d) => d.id)).toEqual(["doc1"]);
  });
});
