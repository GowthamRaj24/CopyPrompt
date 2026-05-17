/**
 * Quick smoke test for the embedding API.
 * Run: npx tsx scripts/test-embedding.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { embedQuery, embedDocument, isEmbeddingConfigured } = await import(
    "../src/server/lib/embeddings"
  );

  if (!isEmbeddingConfigured()) {
    console.error("Set TOGETHER_API_KEY or HF_TOKEN in .env.local");
    process.exit(1);
  }

  console.log("Embedding query…");
  const q = await embedQuery("cyberpunk portrait lighting");
  console.log("Query vector length:", q.length, "sample:", q.slice(0, 3));

  console.log("Embedding document…");
  const d = await embedDocument("A cinematic neon city portrait at night");
  console.log("Doc vector length:", d.length);

  let dot = 0;
  for (let i = 0; i < q.length; i++) dot += q[i]! * d[i]!;
  console.log("Cosine similarity (dot product, normalized):", dot.toFixed(4));
  console.log("OK — embedding API works");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
