/**
 * Applies drizzle/0003_performance_indexes.sql (idempotent).
 * Not tracked by drizzle-kit journal — run via npm run db:migrate-indexes
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1, prepare: false });

const MIGRATION_PATH = resolve(
  process.cwd(),
  "drizzle",
  "0003_performance_indexes.sql",
);

async function main() {
  console.log("→ Reading migration:", MIGRATION_PATH);
  const migration = readFileSync(MIGRATION_PATH, "utf8");

  console.log("→ Applying performance indexes (idempotent)…");
  await sql.unsafe(migration);
  console.log("✓ Performance indexes applied");
}

main()
  .catch((err) => {
    console.error("\n✗ Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
