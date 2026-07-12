import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import type { Database } from "./database.types";

export type SupabaseServiceClient = SupabaseClient<Database>;

/**
 * Bypasses RLS with the service-role key. Server-only, and only for code
 * paths with no user session to scope a request to — scheduled discovery
 * and digest jobs. Never import this from client code or from a request
 * handler that already has an authenticated `createClient()` session.
 */
export function createServiceClient(): SupabaseServiceClient {
  const env = getServerEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
