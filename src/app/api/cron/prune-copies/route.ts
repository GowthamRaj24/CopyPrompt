import { type NextRequest, NextResponse } from "next/server";
import { rejectUnauthorizedCron } from "@/server/lib/cron-auth";
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
 * recommended pattern).
 *
 * Failing the auth check returns 401 silently. Missing CRON_SECRET in
 * env means the cron is disabled — safer than running unauthenticated.
 */
export async function GET(req: NextRequest) {
  const unauthorized = rejectUnauthorizedCron(req);
  if (unauthorized) return unauthorized;

  const deleted = await prunePromptCopies();

  return NextResponse.json({
    ok: true,
    deleted,
    retentionDays: PROMPT_COPIES_RETENTION_DAYS,
  });
}
