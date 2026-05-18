import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/server/config/env";
import {
  PROMPT_COPIES_RETENTION_DAYS,
  prunePromptCopies,
} from "@/server/services/recent-copies.service";

/**
 * GET /api/cron/prune-copies
 *
 * Deletes prompt_copies rows older than PROMPT_COPIES_RETENTION_DAYS.
 * Designed for Vercel Cron (or any external scheduler) — protected by
 * CRON_SECRET via the `Authorization: Bearer <secret>` header (Vercel's
 * recommended pattern) OR a `?key=<secret>` query param fallback.
 *
 * Failing the auth check returns 401 silently. Missing CRON_SECRET in
 * env means the cron is disabled — safer than running unauthenticated.
 */
export async function GET(req: NextRequest) {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Cron disabled — CRON_SECRET not set" },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const queryKey = req.nextUrl.searchParams.get("key") ?? "";

  if (bearer !== secret && queryKey !== secret) {
    return new NextResponse(null, { status: 401 });
  }

  const deleted = await prunePromptCopies();

  return NextResponse.json({
    ok: true,
    deleted,
    retentionDays: PROMPT_COPIES_RETENTION_DAYS,
  });
}
