"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client, used only by the login page to send a magic link. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
