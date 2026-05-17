/**
 * Supabase BROWSER client.
 *
 * Use in Client Components ("use client"). Reads cookies via document.cookie,
 * so it knows which user is signed in.
 *
 * Uses the publishable key (safe to expose in browser bundle).
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
