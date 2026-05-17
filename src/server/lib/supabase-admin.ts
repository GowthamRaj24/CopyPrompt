/**
 * Supabase ADMIN client.
 *
 * Bypasses Row Level Security using the SECRET key.
 * NEVER import this in Client Components or anything that ends up in the browser bundle.
 *
 * Use ONLY for:
 *   - Background jobs (cron tasks, webhook handlers)
 *   - Admin actions (approving submissions, batch operations)
 *   - Auth user lookups by ID where you need the auth.users row
 */
import { createClient } from "@supabase/supabase-js";
import { env } from "@/server/config/env";

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
