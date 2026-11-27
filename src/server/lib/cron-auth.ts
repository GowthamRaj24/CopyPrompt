import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/server/config/env";

/**
 * Guard for /api/cron/* routes.
 *
 * Accepts ONLY `Authorization: Bearer <CRON_SECRET>` — the header Vercel
 * Cron sends. The old `?key=` query fallback was removed because query
 * strings end up in access logs, analytics and browser history.
 *
 * Returns `null` when authorized, or the response to send back.
 */
export function rejectUnauthorizedCron(req: Request): Response | null {
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

  return safeEqual(bearer, secret)
    ? null
    : new NextResponse(null, { status: 401 });
}

/** Constant-time comparison (hash first so lengths always match). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
