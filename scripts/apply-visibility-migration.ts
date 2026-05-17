/**
 * Apply drizzle/0004_prompt_visibility.sql (visibility + share_token).
 * Run: npx tsx scripts/apply-visibility-migration.ts
 */
import { readFileSync } from "node:fs";
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

const sql = postgres(url, { max: 1 });
const migration = readFileSync(
  join(process.cwd(), "drizzle", "0004_prompt_visibility.sql"),
  "utf8",
);

async function main() {
  await sql.unsafe(migration);
  console.log("Applied 0004_prompt_visibility.sql");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
