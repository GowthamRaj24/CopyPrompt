/**
 * Supabase SERVER client.
 *
 * Use in:
 *   - Server Components (pages with `async function Page()`)
 *   - Route Handlers (API routes in src/app/api/)
 *   - Server Actions
 *
 * Reads/writes auth cookies via Next.js cookies() helper, so the user
 * stays signed in across SSR requests.
 *
 * Uses the publishable key — Row Level Security still enforces auth.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/server/config/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll fails when called from a Server Component.
            // Middleware refreshes sessions, so this is safe to ignore.
          }
        },
      },
    },
  );
}
