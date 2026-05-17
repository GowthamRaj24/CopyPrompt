import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import { createClient } from "@/server/lib/supabase-server";
import {
  AccountDeletionError,
  deleteUserAccount,
} from "@/server/services/account.service";

/**
 * POST /api/account/delete
 *
 * Body: { confirm: "DELETE" }
 *
 * Two-factor confirmation: the user must (1) be currently signed in AND
 * (2) include the exact magic string "DELETE" in the body. Magic strings
 * inside the request body are awkward to forge from cross-site requests
 * and they prevent accidental deletes from misclicked links.
 *
 * Returns 204 on success and the client should hard-navigate to a
 * post-delete page. We also invalidate the session here just in case.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not signed in" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: { confirm?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is also acceptable for "are you sure" UIs; we just fail
    // the confirm check below.
  }

  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      {
        error:
          "Confirmation phrase missing. Type DELETE in the confirmation box.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await deleteUserAccount(user.id);

    // Best-effort sign-out so the stale cookie can't be reused even if it
    // was sniffed mid-flight.
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Already invalid because the auth.users row is gone — safe to ignore.
    }

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof AccountDeletionError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[/api/account/delete] unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const dynamic = "force-dynamic";
