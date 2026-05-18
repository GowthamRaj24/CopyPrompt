import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/config/env";

/**
 * Supabase client for Route Handlers (e.g. /auth/callback).
 *
 * Must bind cookies to the same `NextResponse` that is returned — otherwise
 * `exchangeCodeForSession` succeeds but the browser never receives session
 * cookies and the user appears logged out after redirect.
 */
export function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
}

/** Prevent open redirects via `?next=` */
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}
