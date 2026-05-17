import { runHealthChecks } from "@/server/lib/health";

/**
 * GET /api/health
 *
 * Lightweight uptime probe. Wire any of the following at a 30–60s interval:
 *   - BetterStack  https://betterstack.com (free for 1 monitor, fast alerts)
 *   - UptimeRobot  https://uptimerobot.com (free for 50 monitors @ 5min)
 *   - Cronitor     https://cronitor.io
 *   - GCP Cloud Monitoring / AWS Route 53 health checks
 *
 * Returns:
 *   200  - everything healthy
 *   503  - at least one dependency is down (DB, etc.)
 *
 * Response body is small JSON. The Cache-Control header explicitly forbids
 * caching so monitors always see the live state.
 *
 * Security: this endpoint is intentionally public. It returns NO sensitive
 * data — only a per-check ok/latency. If you want auth, add a shared-secret
 * header check here and pass that secret to your monitor.
 */
export async function GET() {
  const report = await runHealthChecks();

  return new Response(JSON.stringify(report, null, 2), {
    status: report.ok ? 200 : 503,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export const dynamic = "force-dynamic";
