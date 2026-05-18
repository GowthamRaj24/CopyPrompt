import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import {
  clearUserCopyHistory,
  listRecentCopiedPrompts,
} from "@/server/services/recent-copies.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** GET /api/account/recent-copies?limit=12 — distinct prompts recently copied. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { results: [] },
      { headers: NO_STORE },
    );
  }

  const rawLimit = Number.parseInt(
    req.nextUrl.searchParams.get("limit") ?? "12",
    10,
  );
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(24, rawLimit))
    : 12;

  const results = await listRecentCopiedPrompts(user.id, limit);
  return NextResponse.json({ results }, { headers: NO_STORE });
}

/** DELETE /api/account/recent-copies — wipe history. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  await clearUserCopyHistory(user.id);
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
