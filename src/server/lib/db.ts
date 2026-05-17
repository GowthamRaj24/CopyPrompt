import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/server/config/env";
import * as schema from "@/server/models";

/**
 * Drizzle Postgres client for the app.
 *
 * Connection-pool strategy
 * ────────────────────────
 * Each Next.js process holds its own pool. We size it to balance two risks:
 *   • Too small → requests queue behind a single connection, p95 explodes.
 *   • Too large → multiplied across instances, you exhaust the upstream
 *     Postgres connection limit (Supabase free tier = 60).
 *
 * The default (10) works for a single-instance deployment on Supabase free
 * tier with a comfortable safety margin. Override via DB_POOL_SIZE if you
 * scale horizontally or use the PgBouncer pooler URL (port 6543).
 *
 * In Next.js dev mode, hot reload would create a new pool on every change,
 * exhausting connections within a few edits. We cache the client on
 * globalThis to survive HMR.
 */
const globalForDb = globalThis as unknown as {
  dbClient?: ReturnType<typeof postgres>;
};

const poolSize = (() => {
  const raw = env.DB_POOL_SIZE;
  if (!raw) return 10;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
})();

const client =
  globalForDb.dbClient ??
  postgres(env.DATABASE_URL, {
    max: poolSize,
    idle_timeout: 20,
    connect_timeout: 10,
    // PgBouncer transaction-mode (Supabase pooler port 6543) does not
    // support prepared statements — keeping this off is the safe default.
    prepare: false,
  });

if (env.NODE_ENV !== "production") {
  globalForDb.dbClient = client;
}

export const db = drizzle(client, {
  schema,
  // Opt-in only — set DB_LOG=1 in .env.local when you want SQL traces.
  // The default (off) keeps dev logs readable and avoids logger overhead.
  logger: env.DB_LOG === "1" || env.DB_LOG === "true",
});

export type DB = typeof db;
