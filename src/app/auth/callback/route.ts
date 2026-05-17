import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/server/lib/supabase-server";

/**
 * GET /auth/callback
 *
 * Handles two flows:
 *   1. Magic link (token_hash + type=magiclink/signup/recovery/invite)
 *   2. OAuth (code from Google/GitHub/etc.)
 *
 * On success: redirects to `next` query param (default: /).
 * On failure: redirects to /signin with error.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // === Magic link flow ===
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, req.url));
    }
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  // === OAuth flow ===
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, req.url));
    }
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  return NextResponse.redirect(
    new URL("/signin?error=no-token", req.url),
  );
}
