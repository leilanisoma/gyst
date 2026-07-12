"use server";

import { getServerEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type SendMagicLinkResult = { ok: true } | { ok: false; error: string };

export async function sendMagicLink(): Promise<SendMagicLinkResult> {
  const env = getServerEnv();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: env.ALLOWED_USER_EMAIL,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
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
