import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/server/lib/supabase-server";

/**
 * POST /auth/signout
 *
 * Signs the user out and redirects to home.
 * POST-only to prevent CSRF (someone embedding /auth/signout in a link).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
