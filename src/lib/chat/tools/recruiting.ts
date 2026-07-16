import { z } from "zod";
import { registerTool, clampLimit } from "./types";
import { APPLICATION_STAGES } from "@/lib/recruiting";

const argsSchema = z.object({
  stage: z
    .enum(APPLICATION_STAGES as unknown as [string, ...string[]])
    .optional(),
  limit: z.number().optional(),
});

registerTool({
  name: "get_recruiting_overview",
  description:
    "Get recruiting applications (optionally filtered by stage), the opportunities/companies they reference, and contacts due for follow-up. Match an application to its opportunity via opportunity_id, and an opportunity to its company via company_id, against the returned lists.",
  dataTier: "private",
  parameters: {
    type: "object",
    properties: {
      stage: {
        type: "string",
        enum: APPLICATION_STAGES,
        description: "Filter applications by pipeline stage.",
      },
      limit: {
        type: "integer",
        description: "Max applications, default 20, max 50.",
      },
    },
    required: [],
  },
  argsSchema,
  async execute(ctx, args) {
    const limit = clampLimit(args.limit, 20, 50);

    let appsQuery = ctx.supabase
      .from("applications")
      .select(
        "id, opportunity_id, stage, next_action, next_action_date, submitted_date, notes",
      )
      .eq("user_id", ctx.userId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (args.stage) appsQuery = appsQuery.eq("stage", args.stage);
    const { data: applications, error: appsError } = await appsQuery;
    if (appsError) throw new Error(appsError.message);

    const opportunityIds = [
      ...new Set((applications ?? []).map((a) => a.opportunity_id)),
    ];
    const { data: opportunities, error: oppError } = opportunityIds.length
      ? await ctx.supabase
          .from("opportunities")
          .select(
            "id, company_id, title, role_family, deadline, location, url, active",
          )
          .in("id", opportunityIds)
      : { data: [], error: null };
    if (oppError) throw new Error(oppError.message);

    const companyIds = [
      ...new Set((opportunities ?? []).map((o) => o.company_id)),
    ];
    const { data: companies, error: companiesError } = companyIds.length
      ? await ctx.supabase
          .from("companies")
          .select("id, name, established")
          .in("id", companyIds)
      : { data: [], error: null };
    if (companiesError) throw new Error(companiesError.message);

    const { data: contactsDue, error: contactsError } = await ctx.supabase
      .from("contacts")
      .select("id, name, role, company_id, relationship, next_contact_at")
      .eq("user_id", ctx.userId)
      .not("next_contact_at", "is", null)
      .lte("next_contact_at", new Date().toISOString())
      .limit(20);
    if (contactsError) throw new Error(contactsError.message);

    return {
      applications: applications ?? [],
      opportunities: opportunities ?? [],
      companies: companies ?? [],
      contactsDueForFollowUp: contactsDue ?? [],
    };
  },
});
