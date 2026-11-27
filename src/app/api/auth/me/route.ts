import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";

/**
 * GET /api/auth/me
 *
 * Returns the signed-in user's public profile fields, or `{ user: null }`.
 *
 * Why this exists: the site header used to call `getCurrentUser()` during
 * the server render. Reading auth cookies in the root layout made EVERY
 * route dynamic, so no page could be served from the CDN cache. The header
 * now renders statically and asks this endpoint once per tab instead
 * (see `CurrentUserProvider`).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    console.error("[/api/auth/me] lookup failed:", err);
  }

  return NextResponse.json(
    {
      user: user
        ? {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            plan: user.plan,
          }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
