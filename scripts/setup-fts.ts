/**
 * Idempotent full-text-search setup.
 *
 * Why a script (and not just `drizzle-kit push`)
 * ──────────────────────────────────────────────
 * Drizzle-kit doesn't model Postgres GENERATED columns or GIN indexes
 * reliably yet. Running this script:
 *
 *   1. Applies `drizzle/0002_fulltext_search.sql` (idempotent — safe to
 *      re-run on a fresh DB or one that already has the column).
 *   2. Verifies the column was created.
 *   3. Verifies the index exists.
 *   4. Runs a sample EXPLAIN to confirm queries actually use the index.
 *
 * Run once after deploy:
 *   npm run db:setup-fts
 *
 * Re-run safely anytime — it's a no-op if everything is already in place.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

// Match drizzle.config.ts — load `.env.local` first (project convention)
// then fall back to `.env`. tsx doesn't auto-load either, so we do it here.
config({ path: ".env.local" });
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  max: 1,
  prepare: false,
});

const MIGRATION_PATH = resolve(
  process.cwd(),
  "drizzle",
  "0002_fulltext_search.sql",
);

async function main() {
  console.log("→ Reading migration:", MIGRATION_PATH);
  const migration = readFileSync(MIGRATION_PATH, "utf8");

  console.log("→ Applying full-text search schema (idempotent)…");
  await sql.unsafe(migration);
  console.log("  ✓ Migration applied");

  console.log("→ Verifying search_doc column…");
  const [col] = await sql<Array<{ column_name: string; data_type: string }>>`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'prompts'
      AND column_name = 'search_doc'
  `;
  if (!col) {
    throw new Error("search_doc column missing — migration did not apply");
  }
  console.log(`  ✓ Column present (${col.data_type})`);

  console.log("→ Verifying GIN index…");
  const [idx] = await sql<Array<{ indexname: string }>>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'prompts'
      AND indexname = 'idx_prompts_search_doc'
  `;
  if (!idx) {
    throw new Error("idx_prompts_search_doc missing");
  }
  console.log(`  ✓ Index present (${idx.indexname})`);

  console.log("→ EXPLAIN sample query…");
  const plan = await sql<Array<{ "QUERY PLAN": string }>>`
    EXPLAIN
    SELECT id, title
    FROM prompts
    WHERE search_doc @@ websearch_to_tsquery('english', 'cyberpunk portrait')
    LIMIT 10
  `;
  const planText = plan.map((r) => r["QUERY PLAN"]).join("\n");
  console.log(planText);

  const usesIndex =
    planText.includes("idx_prompts_search_doc") ||
    planText.includes("Bitmap Index Scan");
  if (!usesIndex) {
    console.warn(
      "  ⚠ Plan does not appear to use the GIN index. " +
        "This is OK if your prompts table is small (planner may prefer Seq Scan), " +
        "but verify again once you have >1000 rows.",
    );
  } else {
    console.log("  ✓ Query plan uses the GIN index");
  }

  console.log("\n✓ Full-text search is ready.");
}

main()
  .catch((err) => {
    console.error("\n✗ Setup failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
