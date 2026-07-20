"use server";

import { getServerEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type SendMagicLinkResult = { ok: true } | { ok: false; error: string };

// Deliberately no `emailRedirectTo` / link-based magic link: Gmail and other
// mail security scanners prefetch links in email bodies, which silently
// burns the single-use token before the user ever clicks it (surfaces as
// otp_expired on first click, every time). A typed code has nothing for a
// scanner to consume.
export async function sendMagicLink(): Promise<SendMagicLinkResult> {
  const env = getServerEnv();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: env.ALLOWED_USER_EMAIL,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export type VerifyCodeResult = { ok: true } | { ok: false; error: string };

export async function verifyLoginCode(code: string): Promise<VerifyCodeResult> {
  const env = getServerEnv();
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email: env.ALLOWED_USER_EMAIL,
    token: code,
    type: "email",
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
