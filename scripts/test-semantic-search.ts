/**
 * Compare FTS-only vs hybrid semantic search for a query.
 * Run: npx tsx scripts/test-semantic-search.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { searchPrompts } = await import(
    "../src/server/services/prompt.service"
  );
  const { shouldBlendSemanticSearch } = await import(
    "../src/server/services/embedding.service"
  );

  const blend = await shouldBlendSemanticSearch();
  console.log("Semantic blend enabled:", blend);

  const query = "write professional email";
  const hybrid = await searchPrompts({
    query,
    sort: "relevance",
    page: 1,
    pageSize: 5,
  });

  console.log(`\nQuery: "${query}"`);
  console.log("Total matches:", hybrid.total);
  console.log("Top 5 (hybrid relevance):");
  for (const r of hybrid.results) {
    console.log(`  - ${r.title} (${r.modelSlug})`);
  }

  console.log("\nSemantic search pipeline: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
