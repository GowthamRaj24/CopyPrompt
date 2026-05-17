/**
 * Quick check: FTS column/index + embedding population.
 * Run: npx tsx scripts/verify-search.ts
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 15 });

async function main() {
  const [fts] = await sql<[{ total: number; with_doc: number }]>`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE search_doc IS NOT NULL)::int AS with_doc
    FROM prompts WHERE status = 'published'
  `;

  let emb = { total: 0, with_emb: 0 };
  try {
    [emb] = await sql<[{ total: number; with_emb: number }]>`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE embedding IS NOT NULL)::int AS with_emb
      FROM prompts WHERE status = 'published'
    `;
  } catch {
    console.log("embedding column: not present (run npm run db:enable-vector)");
  }

  const indexes = await sql<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'prompts'
    ORDER BY indexname
  `;

  const plan = await sql<{ "QUERY PLAN": string }[]>`
    EXPLAIN
    SELECT id FROM prompts
    WHERE status = 'published'
      AND search_doc @@ websearch_to_tsquery('english', 'portrait')
    LIMIT 5
  `;

  const hit = await sql<{ c: number }[]>`
    SELECT count(*)::int AS c FROM prompts
    WHERE status = 'published'
      AND search_doc @@ websearch_to_tsquery('english', 'portrait')
  `;

  console.log("\n=== Full-text search (FTS) ===");
  console.log("Published prompts:", fts);
  console.log("Sample query 'portrait' hits:", hit[0]?.c ?? 0);
  console.log(
    "Uses GIN index:",
    plan.some((r) => String(r["QUERY PLAN"]).includes("idx_prompts_search_doc")),
  );
  const hasApi =
    Boolean(process.env.TOGETHER_API_KEY) ||
    Boolean(process.env.HF_TOKEN) ||
    Boolean(process.env.JINA_API_KEY);
  const coverage =
    emb.total > 0 ? ((emb.with_emb / emb.total) * 100).toFixed(1) : "0";

  console.log("\n=== Semantic search (vectors) ===");
  console.log("Published with embedding:", emb, `(${coverage}% coverage)`);
  console.log(
    "Embedding API configured:",
    hasApi ? "yes" : "no (TOGETHER_API_KEY, HF_TOKEN, or JINA_API_KEY)",
  );
  console.log(
    "Hybrid relevance active when coverage >= 15%:",
    emb.total > 0 && emb.with_emb / emb.total >= 0.15 ? "yes" : "no — run npm run db:backfill-embeddings",
  );
  console.log("\nRelevant indexes:", indexes.map((i) => i.indexname).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => sql.end());
