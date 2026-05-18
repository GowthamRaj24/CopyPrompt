import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/server/config/env";
import { refreshAllContributorStats } from "@/server/services/contributor.service";

/**
 * GET /api/cron/refresh-contributor-stats
 *
 * Daily refresh of `users.total_copies_received` + `total_prompts_published`.
 * Auth: Bearer token (Vercel Cron) or `?key=` query param against CRON_SECRET.
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

  const result = await refreshAllContributorStats();
  return NextResponse.json({ ok: true, ...result });
}
