"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateCompany } from "./company-helpers";
import type { ContactRelationship, InteractionKind } from "@/lib/recruiting";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateContactInput = {
  name: string;
  role: string | null;
  companyName: string | null;
  relationship: ContactRelationship;
  email: string | null;
  linkedinUrl: string | null;
};

export async function createContact(
  input: CreateContactInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  let companyId: string | null = null;
  const companyName = input.companyName?.trim();
  if (companyName) {
    const company = await findOrCreateCompany(supabase, user.id, companyName);
    if ("error" in company) {
      return { ok: false, error: company.error };
    }
    companyId = company.id;
  }

  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    company_id: companyId,
    name,
    role: input.role,
    relationship: input.relationship,
    email: input.email,
    linkedin_url: input.linkedinUrl,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/recruiting");
  return { ok: true };
}

export async function deleteContact(contactId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/recruiting");
  return { ok: true };
}

export type LogInteractionInput = {
  kind: InteractionKind;
  summary: string;
  occurredAt: string;
  followUpAt: string | null;
  applicationId: string | null;
};

export async function logInteraction(
  contactId: string,
  input: LogInteractionInput,
): Promise<ActionResult> {
  const summary = input.summary.trim();
  if (!summary) {
    return { ok: false, error: "Summary is required." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase.from("interactions").insert({
    user_id: user.id,
    contact_id: contactId,
    application_id: input.applicationId,
    kind: input.kind,
    summary,
    occurred_at: input.occurredAt,
    follow_up_at: input.followUpAt,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase
    .from("contacts")
    .update({
      last_contacted_at: input.occurredAt,
      next_contact_at: input.followUpAt,
    })
    .eq("id", contactId);

  revalidatePath("/recruiting");
  return { ok: true };
}
