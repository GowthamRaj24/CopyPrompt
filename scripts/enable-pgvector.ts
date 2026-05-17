/**
 * One-time setup: enable pgvector extension + add embedding column.
 *
 * Run with:  npx tsx scripts/enable-pgvector.ts
 *
 * Idempotent — safe to re-run. Uses IF NOT EXISTS everywhere.
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

async function main() {
  console.log("Enabling pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  console.log("Adding embedding column to prompts (vector 768)...");
  // 768 dimensions matches BAAI/bge-base-en-v1.5 from Together AI
  await sql`
    ALTER TABLE prompts
    ADD COLUMN IF NOT EXISTS embedding vector(768)
  `;

  console.log("Verifying setup...");
  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int as count FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'embedding'
  `;

  if (count === 1) {
    console.log("✓ pgvector extension enabled");
    console.log("✓ prompts.embedding column ready (vector 768)");
  } else {
    console.error("✗ Setup failed - embedding column not found");
    process.exit(1);
  }

  // Note: We skip the HNSW index creation here.
  // With <1000 rows, sequential scan is faster than HNSW lookup.
  // Add the index later when prompt count grows:
  //   CREATE INDEX ON prompts USING hnsw (embedding vector_cosine_ops);

  await sql.end();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
