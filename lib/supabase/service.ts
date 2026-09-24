import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the service_role key. This bypasses
 * Row Level Security, so it must only be used on the server, inside API
 * routes that have already checked identity()/isAdmin themselves — the
 * same authority model the original Cloudflare D1 backend used.
 */
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
