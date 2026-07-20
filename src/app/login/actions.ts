"use server";

import { getServerEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type SignInResult = { ok: true } | { ok: false; error: string };

export async function signInWithPassword(password: string): Promise<SignInResult> {
  const env = getServerEnv();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: env.ALLOWED_USER_EMAIL,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
