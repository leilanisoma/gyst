import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function findOrCreateCompany(
  supabase: SupabaseServerClient,
  userId: string,
  name: string,
  established?: boolean,
): Promise<{ id: string } | { error: string }> {
  const { data: existing } = await supabase
    .from("companies")
    .select("id, established")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    if (established !== undefined && existing.established !== established) {
      await supabase
        .from("companies")
        .update({ established })
        .eq("id", existing.id);
    }
    return { id: existing.id };
  }

  const { data: created, error } = await supabase
    .from("companies")
    .insert({ user_id: userId, name, established: established ?? false })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Could not create company." };
  }
  return { id: created.id };
}
