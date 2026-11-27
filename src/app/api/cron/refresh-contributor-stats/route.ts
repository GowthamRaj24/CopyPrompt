import { type NextRequest, NextResponse } from "next/server";
import { rejectUnauthorizedCron } from "@/server/lib/cron-auth";
import { refreshAllContributorStats } from "@/server/services/contributor.service";

/**
 * GET /api/cron/refresh-contributor-stats
 *
 * Daily refresh of `users.total_copies_received` + `total_prompts_published`.
 * Auth: Bearer token (Vercel Cron) against CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const unauthorized = rejectUnauthorizedCron(req);
  if (unauthorized) return unauthorized;

  const result = await refreshAllContributorStats();
  return NextResponse.json({ ok: true, ...result });
}
