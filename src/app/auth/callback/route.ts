import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import {
  createRouteHandlerClient,
  safeNextPath,
} from "@/server/lib/supabase-route";

/**
 * GET /auth/callback
 *
 * Handles:
 *   1. Magic link (token_hash + type)
 *   2. OAuth PKCE (code) — Google, GitHub, etc.
 *
 * Session cookies MUST be written onto the redirect response (see supabase-route.ts).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = safeNextPath(url.searchParams.get("next"));

  const oauthError = url.searchParams.get("error_description")
    ?? url.searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(
      new URL(
        `/signin?error=${encodeURIComponent(oauthError)}`,
        req.url,
      ),
    );
  }

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const response = NextResponse.redirect(new URL(next, req.url));
    const supabase = createRouteHandlerClient(req, response);
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return response;
    }
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  const code = url.searchParams.get("code");
  if (code) {
    const response = NextResponse.redirect(new URL(next, req.url));
    const supabase = createRouteHandlerClient(req, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  return NextResponse.redirect(new URL("/signin?error=no-token", req.url));
}
