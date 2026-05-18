/**
 * Quick sanity check that all retention-feature columns are present.
 * Run: npx tsx scripts/verify-schema.ts
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

const expectedColumns: Array<[string, string]> = [
  // Step 4
  ["users", "welcomed_at"],
  // Step 7
  ["users", "handle"],
  ["users", "bio"],
  // Step 10
  ["users", "total_copies_received"],
  ["users", "total_prompts_published"],
  // Step 3
  ["prompts", "remix_source_id"],
];

const expectedTables = [
  "prompt_copies",
  "saved_searches",
  "collections",
  "collection_prompts",
];

async function main() {
  let ok = true;

  for (const [table, column] of expectedColumns) {
    const rows = await sql<{ data_type: string }[]>`
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    `;
    if (rows.length === 0) {
      console.log(`  ✗ ${table}.${column} MISSING`);
      ok = false;
    } else {
      console.log(`  ✓ ${table}.${column} (${rows[0].data_type})`);
    }
  }

  for (const table of expectedTables) {
    const rows = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    `;
    if (rows.length === 0) {
      console.log(`  ✗ table ${table} MISSING`);
      ok = false;
    } else {
      console.log(`  ✓ table ${table}`);
    }
  }

  await sql.end();
  if (!ok) process.exit(1);
  console.log("\nAll retention-feature schema present.");
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
