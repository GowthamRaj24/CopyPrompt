import { eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { publicPublishedWhere } from "@/lib/prompt-visibility";
import { db } from "@/server/lib/db";
import {
  buildEmbeddingText,
  embedDocument,
  isEmbeddingConfigured,
} from "@/server/lib/embeddings";
import { prompts } from "@/server/models/prompt.model";

/**
 * Generate and persist a prompt embedding (no-op if API keys unset).
 * Safe to call fire-and-forget after publish.
 */
export async function refreshPromptEmbedding(promptId: string): Promise<void> {
  if (!isEmbeddingConfigured()) return;

  const [row] = await db
    .select({
      title: prompts.title,
      promptText: prompts.promptText,
      tips: prompts.tips,
      expectedOutcome: prompts.expectedOutcome,
    })
    .from(prompts)
    .where(eq(prompts.id, promptId))
    .limit(1);

  if (!row) return;

  const text = buildEmbeddingText(row);
  const embedding = await embedDocument(text);

  await db
    .update(prompts)
    .set({ embedding })
    .where(eq(prompts.id, promptId));
}

/** Minimum share of catalog with embeddings before we blend semantic scores. */
export const SEMANTIC_BLEND_MIN_COVERAGE = 0.15;

/**
 * Embedding coverage of the public catalog. Cached for an hour — it used to
 * run a full-table `count(*)` on every prompt view and every search.
 */
const getEmbeddingCoverage = unstable_cache(
  async () => {
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        withEmb: sql<number>`count(*) FILTER (WHERE ${prompts.embedding} IS NOT NULL)::int`,
      })
      .from(prompts)
      .where(publicPublishedWhere());
    return { total: row?.total ?? 0, withEmb: row?.withEmb ?? 0 };
  },
  ["embedding-coverage"],
  { revalidate: 3600, tags: ["embedding-coverage"] },
);

export async function shouldBlendSemanticSearch(): Promise<boolean> {
  if (!isEmbeddingConfigured()) return false;
  const { total, withEmb } = await getEmbeddingCoverage();
  if (total === 0) return false;
  return withEmb / total >= SEMANTIC_BLEND_MIN_COVERAGE;
}

export { isEmbeddingConfigured };
