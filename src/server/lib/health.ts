import { sql } from "drizzle-orm";
import { db } from "@/server/lib/db";

/**
 * System health checks for monitoring.
 *
 * Each check is independent — one failure does NOT short-circuit the others.
 * Total time is bounded by the per-check timeout so we never block an
 * uptime probe.
 *
 * Run from `/api/health` (public, cacheable for 0s) and any cron pinger
 * like BetterStack, UptimeRobot, or Cronitor.
 */

export interface HealthCheckResult {
  name: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface HealthReport {
  ok: boolean;
  uptimeSec: number;
  timestamp: string;
  checks: HealthCheckResult[];
}

const BOOT_TIME = Date.now();
const CHECK_TIMEOUT_MS = 2_500;

/**
 * Wraps a promise with a hard timeout so a hung dependency never stalls
 * the health endpoint. Returns a `HealthCheckResult` in either case so
 * the caller doesn't have to try/catch each one.
 */
async function timed(
  name: string,
  fn: () => Promise<unknown>,
): Promise<HealthCheckResult> {
  const start = performance.now();
  try {
    await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`timeout after ${CHECK_TIMEOUT_MS}ms`)),
          CHECK_TIMEOUT_MS,
        ),
      ),
    ]);
    return {
      name,
      ok: true,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    return {
      name,
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/**
 * Cheap connection check — does NOT scan a table.
 * If this fails, the whole app is down.
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  return timed("database", async () => {
    await db.execute(sql`SELECT 1`);
  });
}

/**
 * Run all checks in parallel and produce a combined report.
 * Overall `ok` is true iff every check passed.
 */
export async function runHealthChecks(): Promise<HealthReport> {
  const checks = await Promise.all([checkDatabase()]);

  return {
    ok: checks.every((c) => c.ok),
    uptimeSec: Math.round((Date.now() - BOOT_TIME) / 1000),
    timestamp: new Date().toISOString(),
    checks,
  };
}
