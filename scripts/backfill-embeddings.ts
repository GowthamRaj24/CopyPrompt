/**
 * Backfill vector embeddings for published prompts missing `embedding`.
 *
 * Requires TOGETHER_API_KEY or HF_TOKEN in .env.local.
 * Run after: npm run db:enable-vector
 *
 *   npm run db:backfill-embeddings
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

async function main() {
  const { env } = await import("../src/server/config/env");
  const { refreshPromptEmbedding } = await import(
    "../src/server/services/embedding.service"
  );
  const { isEmbeddingConfigured } = await import(
    "../src/server/lib/embeddings"
  );

  if (!isEmbeddingConfigured()) {
    console.error(
      "Set TOGETHER_API_KEY, HF_TOKEN (with Inference Providers), or JINA_API_KEY in .env.local",
    );
    process.exit(1);
  }

  const hasTogether = Boolean(env.TOGETHER_API_KEY);

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const sql = postgres(url, { max: 1, prepare: false });

  const missing = await sql<{ id: string; title: string }[]>`
    SELECT id, title FROM prompts
    WHERE status = 'published' AND embedding IS NULL
    ORDER BY created_at ASC
  `;

  console.log(
    `Provider: ${hasTogether ? "Together AI (BGE)" : "Hugging Face (BGE)"}`,
  );
  console.log(`Prompts to embed: ${missing.length}`);

  let ok = 0;
  let failed = 0;
  const delayMs = Number(process.env.EMBED_BACKFILL_DELAY_MS ?? 350);

  for (let i = 0; i < missing.length; i++) {
    const row = missing[i];
    if (!row) continue;
    try {
      await refreshPromptEmbedding(row.id);
      ok++;
      process.stdout.write(
        `\r[${i + 1}/${missing.length}] ${row.title.slice(0, 50)}…`,
      );
    } catch (err) {
      failed++;
      console.error(`\n✗ ${row.id}:`, err);
    }
    if (i < missing.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log(`\nDone. Embedded: ${ok}, failed: ${failed}`);

  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM prompts
    WHERE status = 'published' AND embedding IS NOT NULL
  `;
  console.log(`Published prompts with embedding: ${count}`);

  if (count >= 500) {
    console.log(
      "Tip: at 500+ rows, add an HNSW index for faster vector search:",
    );
    console.log(
      "  CREATE INDEX IF NOT EXISTS idx_prompts_embedding_hnsw ON prompts USING hnsw (embedding vector_cosine_ops);",
    );
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
