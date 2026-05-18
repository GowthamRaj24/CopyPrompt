import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/lib/db";
import { createClient } from "@/server/lib/supabase-server";
import { users } from "@/server/models/user.model";
import { welcomeIfFirstSignIn } from "@/server/services/welcome.service";

/**
 * Auth helpers for server components and route handlers.
 *
 * Performance contract:
 *   `getCurrentUser()` is wrapped in React's `cache()` so it is memoized
 *   PER REQUEST. The Header, the page-level `requireUser()`, the admin
 *   layout, and any nested component can all call it freely — only the
 *   FIRST call actually hits Supabase Auth + Postgres. Every subsequent
 *   call in the same request returns the already-resolved promise.
 *
 *   Before this change a typical authenticated page made 2-4 redundant
 *   `supabase.auth.getUser()` round-trips and an equal number of duplicate
 *   `SELECT FROM users` queries per request.
 */

export interface AppUser {
  /** Supabase auth.users.id (and public.users.id - they match) */
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  plan: "free" | "premium" | "admin";
}

/**
 * Get the current signed-in user, joined with our public.users row.
 * Returns null if not signed in.
 *
 * Memoized per-request via `React.cache()`. Safe to call from anywhere
 * in the server render tree — duplicate calls are deduped to a single
 * Supabase Auth check + a single Postgres lookup.
 */
export const getCurrentUser = cache(
  async (): Promise<AppUser | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Read our app-level fields (plan, etc.) from public.users
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        plan: users.plan,
        welcomedAt: users.welcomedAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!row) {
      // The auth.users row exists but public.users hasn't synced yet.
      // Return what we know from the auth row.
      return {
        id: user.id,
        email: user.email ?? "",
        fullName: (user.user_metadata?.full_name as string) ?? null,
        avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
        plan: "free",
      };
    }

    // Fire welcome email exactly once. Atomic claim inside the service
    // makes this safe to call from every authenticated render.
    if (!row.welcomedAt && row.email) {
      void welcomeIfFirstSignIn({
        userId: row.id,
        email: row.email,
        fullName: row.fullName,
      });
    }

    return {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      plan: row.plan as "free" | "premium" | "admin",
    };
  },
);

/**
 * Require an authenticated user. Redirects to /signin if not.
 * Preserves the original URL via `?next=` so the user lands back here
 * after signing in.
 *
 * Use this at the top of protected pages (server components).
 */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    const headersList = await headers();
    const currentUrl = headersList.get("x-url") ?? "/";
    const next = encodeURIComponent(currentUrl);
    redirect(`/signin?next=${next}`);
  }
  return user;
}

/**
 * Require an admin user. Redirects to /signin if not signed in,
 * or to home with a flash if not an admin.
 *
 * For Route Handlers (fetch from the client), use `requireAdminApi()` —
 * `redirect()` breaks JSON responses and approve/reject look "broken".
 */
export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.plan !== "admin") {
    redirect("/?error=admin-required");
  }
  return user;
}

function jsonAuthError(status: 401 | 403, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Admin guard for API routes. Returns JSON 401/403 instead of redirecting.
 */
export async function requireAdminApi(): Promise<AppUser | Response> {
  const user = await getCurrentUser();
  if (!user) {
    return jsonAuthError(401, "Sign in required");
  }
  if (user.plan !== "admin") {
    return jsonAuthError(403, "Admin access required");
  }
  return user;
}
