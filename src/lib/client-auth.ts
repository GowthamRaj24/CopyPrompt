/**
 * Client-side auth probe — memoized per tab.
 *
 * Pages already render with a `FavoritesProvider` that may or may not
 * know whether the user is signed in; the guest-funnel utilities need a
 * single source of truth without firing `supabase.auth.getUser()` on
 * every copy click.
 *
 * Strategy
 * ────────
 *   - First call: `supabase.auth.getUser()` → cache the boolean
 *   - Subsequent calls: return cached value
 *   - On `storage` events (sign-in/out in another tab) we invalidate
 *     the cache so the next call re-checks.
 */
import { createClient } from "@/lib/supabase-client";

let cachedSignedIn: boolean | null = null;
let inflight: Promise<boolean> | null = null;
let listenerAttached = false;

function attachInvalidation() {
  if (listenerAttached || typeof window === "undefined") return;
  listenerAttached = true;
  // Supabase persists session under storage keys starting with `sb-`.
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("sb-")) {
      cachedSignedIn = null;
      inflight = null;
    }
  });
}

export async function isClientAuthSignedIn(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  attachInvalidation();
  if (cachedSignedIn !== null) return cachedSignedIn;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      cachedSignedIn = Boolean(data.user);
      return cachedSignedIn;
    } catch {
      cachedSignedIn = false;
      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Forcibly invalidate the cached state — useful after sign-out flow. */
export function invalidateClientAuthCache(): void {
  cachedSignedIn = null;
  inflight = null;
}
