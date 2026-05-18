/**
 * Apply every raw-SQL migration in `drizzle/` that isn't tracked by
 * `drizzle/meta/_journal.json`.
 *
 * Why this exists
 * ───────────────
 * The codebase mixes drizzle-kit auto-generated migrations (0000, 0001)
 * with hand-written SQL files (0002+). Drizzle's `migrate` command only
 * runs the journaled ones, so the manual files would otherwise need to
 * be applied one by one via individual `apply-*.ts` scripts.
 *
 * This script:
 *   - Lists every `drizzle/NNNN_*.sql` file
 *   - Skips the ones already in `_journal.json` (handled by drizzle-kit)
 *   - Runs the rest in numeric order against `DATABASE_URL`
 *
 * Every file in this repo is defensive (`CREATE TABLE IF NOT EXISTS`,
 * `ADD COLUMN IF NOT EXISTS`, `DO $$ ... pg_constraint guards`), so
 * re-running this script is safe and idempotent.
 *
 * Run: npm run db:migrate-pending
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const DRIZZLE_DIR = join(process.cwd(), "drizzle");
const JOURNAL = join(DRIZZLE_DIR, "meta", "_journal.json");

interface JournalEntry {
  idx: number;
  tag: string;
}

interface Journal {
  entries: JournalEntry[];
}

function loadJournal(): Set<string> {
  try {
    const raw = readFileSync(JOURNAL, "utf8");
    const data = JSON.parse(raw) as Journal;
    return new Set(data.entries.map((e) => e.tag));
  } catch {
    console.warn("[migrate-pending] no journal found — applying ALL .sql files");
    return new Set<string>();
  }
}

function pendingFiles(): string[] {
  const journaled = loadJournal();
  return readdirSync(DRIZZLE_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => {
      // Strip `.sql` to compare against journal tags (e.g. "0007_prompt_remix_source")
      const tag = f.replace(/\.sql$/, "");
      return !journaled.has(tag);
    });
}

async function main() {
  const sql = postgres(url!, { max: 1, prepare: false });
  const files = pendingFiles();

  if (files.length === 0) {
    console.log("[migrate-pending] no pending migrations.");
    await sql.end();
    return;
  }

  console.log(`[migrate-pending] applying ${files.length} migration(s):`);
  for (const f of files) console.log(`  - ${f}`);
  console.log("");

  for (const file of files) {
    const path = join(DRIZZLE_DIR, file);
    const body = readFileSync(path, "utf8");
    process.stdout.write(`  ${file} ... `);
    try {
      await sql.unsafe(body);
      process.stdout.write("ok\n");
    } catch (err) {
      process.stdout.write("FAILED\n");
      console.error(err);
      await sql.end();
      process.exit(1);
    }
  }

  console.log("\n[migrate-pending] done.");
  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
