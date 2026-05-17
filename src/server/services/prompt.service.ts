import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/server/lib/db";
import { categories } from "@/server/models/category.model";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";

/**
 * Business logic for prompts. Controllers call into here.
 * Keeps DB queries out of route handlers and out of UI code.
 *
 * Optimization notes:
 *   - List views select only the columns needed (no full prompt_text)
 *   - Image lookups are batch-fetched (1 query, not N+1)
 *   - Search uses a single query with SQL window count (no separate COUNT)
 *   - Detail page uses a single JOIN query for prompt + model + category
 *   - Hot read paths (`getPromptBySlug`, `getTrendingPrompts`) are wrapped
 *     in `React.cache()` so duplicate calls inside one server render are
 *     deduplicated. Critical for `/prompt/[slug]` where both
 *     `generateMetadata()` and the page itself fetch by slug.
 */

export interface PromptListItem {
  id: string;
  slug: string;
  title: string;
  modelName: string;
  modelSlug: string;
  modelType: "image" | "text";
  /** Truncated prompt text — only first 280 chars for card previews */
  promptText: string;
  /** Sample AI output - shown on text-type card previews */
  expectedOutcome: string | null;
  copyCount: number;
  upvotes: number;
  /** Primary image - null for text-type prompts */
  primaryImage: {
    cdnUrl: string;
    width: number;
    height: number;
    alt: string | null;
  } | null;
}

/* ── Shared helpers ──────────────────────────────────────── */

/** Columns needed for list/card views — no full prompt_text */
const listColumns = {
  id: prompts.id,
  slug: prompts.slug,
  title: prompts.title,
  // Truncate prompt_text at DB level: saves transfer + serialization
  promptText: sql<string>`LEFT(${prompts.promptText}, 280)`.as("prompt_text_preview"),
  expectedOutcome: prompts.expectedOutcome,
  copyCount: prompts.copyCount,
  upvotes: prompts.upvotes,
  modelName: models.name,
  modelSlug: models.slug,
  modelType: models.type,
} as const;

/**
 * Given a list of rows, batch-fetch primary images for image-type prompts.
 * Returns a Map of promptId → image data.
 * Avoids N+1 by using a single IN query.
 */
async function batchFetchPrimaryImages(
  rows: Array<{ id: string; modelType: string }>,
): Promise<Map<string, { cdnUrl: string; width: number; height: number; alt: string | null }>> {
  const imagePromptIds = rows
    .filter((r) => r.modelType === "image")
    .map((r) => r.id);

  if (imagePromptIds.length === 0) return new Map();

  const primaryImages = await db
    .select({
      promptId: images.promptId,
      cdnUrl: images.cdnUrl,
      width: images.width,
      height: images.height,
      alt: images.alt,
    })
    .from(images)
    .where(
      and(
        eq(images.isPrimary, true),
        inArray(images.promptId, imagePromptIds),
      ),
    );

  return new Map(primaryImages.map((img) => [img.promptId, img]));
}

/** Map raw rows + images into PromptListItem[] */
function toListItems(
  rows: Array<{
    id: string;
    slug: string;
    title: string;
    promptText: string;
    expectedOutcome: string | null;
    modelName: string;
    modelSlug: string;
    modelType: string;
    copyCount: number;
    upvotes: number;
  }>,
  imageMap: Map<string, { cdnUrl: string; width: number; height: number; alt: string | null }>,
): PromptListItem[] {
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    promptText: r.promptText,
    expectedOutcome: r.expectedOutcome,
    modelName: r.modelName,
    modelSlug: r.modelSlug,
    modelType: r.modelType as "image" | "text",
    copyCount: r.copyCount,
    upvotes: r.upvotes,
    primaryImage: imageMap.get(r.id) ?? null,
  }));
}

/* ── Trending ────────────────────────────────────────────── */

/**
 * Get trending prompts for the homepage.
 * Sorted by copy_count descending. Only published prompts.
 *
 * Optimizations:
 *   - Truncated prompt_text (280 chars) via SQL LEFT()
 *   - Batch image fetch (1 extra query, not N+1)
 *   - Covering index on (status, copy_count DESC)
 */
export const getTrendingPrompts = cache(
  async (limit = 8): Promise<PromptListItem[]> => {
    const rows = await db
      .select(listColumns)
      .from(prompts)
      .innerJoin(models, eq(models.id, prompts.modelId))
      .where(eq(prompts.status, "published"))
      .orderBy(desc(prompts.copyCount))
      .limit(limit);

    if (rows.length === 0) return [];

    const imageMap = await batchFetchPrimaryImages(rows);
    return toListItems(rows, imageMap);
  },
);

/* ── Homepage ranking variants ──────────────────────────── */

/**
 * Generic ranking helper — reused by every "sort by X" homepage section.
 * Keeps each variant down to a single function and a one-line orderBy,
 * which is easier to scan than duplicating the join/select boilerplate
 * across four nearly-identical functions.
 */
async function listPublishedRanked(
  orderBy:
    | ReturnType<typeof desc>
    | ReturnType<typeof asc>
    | ReturnType<typeof sql>,
  limit: number,
): Promise<PromptListItem[]> {
  const rows = await db
    .select(listColumns)
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(eq(prompts.status, "published"))
    .orderBy(orderBy)
    .limit(limit);

  if (rows.length === 0) return [];

  const imageMap = await batchFetchPrimaryImages(rows);
  return toListItems(rows, imageMap);
}

/** Most recently published prompts. Powered by idx_prompts_status_created. */
export const getRecentPrompts = cache((limit = 8) =>
  listPublishedRanked(desc(prompts.createdAt), limit),
);

/** Most-viewed prompts. Powered by idx_prompts_view_count_published. */
export const getMostViewedPrompts = cache((limit = 8) =>
  listPublishedRanked(desc(prompts.viewCount), limit),
);

/**
 * Highest net upvotes (upvotes − downvotes). Powered by the partial
 * expression index `idx_prompts_net_votes_published`. Falls back to a
 * tie-break on copyCount so unrated prompts don't all surface together.
 */
export const getTopRatedPrompts = cache((limit = 8) =>
  listPublishedRanked(
    sql`(${prompts.upvotes} - ${prompts.downvotes}) DESC, ${prompts.copyCount} DESC`,
    limit,
  ),
);

/* ── Search ──────────────────────────────────────────────── */

export type SearchSort =
  | "relevance"
  | "popular" // by copy_count desc
  | "latest" // by created_at desc
  | "views" // by view_count desc
  | "rated"; // by (upvotes - downvotes) desc
export type SearchType = "all" | "image" | "text";

export interface SearchOptions {
  query: string;
  type?: SearchType;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
}

export interface SearchResults {
  results: PromptListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Full-text search over prompts.
 *
 * Backed by a STORED generated `search_doc` tsvector column with a GIN
 * index (see `drizzle/0002_fulltext_search.sql`). The previous version
 * built the tsvector inline on every query, which forced a sequential
 * scan + on-the-fly tokenization for every search — fine at 100 rows,
 * fatal at 10k.
 *
 * Setup once after deploy:
 *   npm run db:setup-fts
 *
 * Query strategy:
 *   - `websearch_to_tsquery` parses Google-style input ("exact phrase",
 *     -negation, OR) so users don't have to learn a query DSL.
 *   - `ts_rank` orders by the same A>B>C weights baked into the column.
 *   - Single query with `COUNT(*) OVER()` window function — no separate
 *     count round-trip (cuts search latency by ~50%).
 *   - 280-char preview of prompt_text via SQL LEFT() to keep payload small.
 *   - Images batch-fetched in one IN() query to avoid N+1.
 */
export async function searchPrompts(
  options: SearchOptions,
): Promise<SearchResults> {
  const { query, type = "all", sort = "relevance", page = 1 } = options;
  const pageSize = options.pageSize ?? 24;
  const offset = (page - 1) * pageSize;
  const trimmed = query.trim();

  const whereClauses = [eq(prompts.status, "published")];

  if (type !== "all") {
    whereClauses.push(eq(models.type, type));
  }

  // Reference the stored generated column — the planner picks the GIN
  // index (idx_prompts_search_doc) automatically once the table has
  // enough rows for an index scan to beat a seq scan.
  const tsQuery = sql`websearch_to_tsquery('english', ${trimmed})`;
  const tsDoc = sql`${prompts.searchDoc}`;

  if (trimmed.length > 0) {
    whereClauses.push(sql`${tsDoc} @@ ${tsQuery}`);
  }

  const whereCondition = and(...whereClauses);

  let orderBy: ReturnType<typeof desc> | ReturnType<typeof sql>;
  if (sort === "latest") {
    orderBy = desc(prompts.createdAt);
  } else if (sort === "popular") {
    orderBy = desc(prompts.copyCount);
  } else if (sort === "views") {
    orderBy = desc(prompts.viewCount);
  } else if (sort === "rated") {
    // Tie-break on copyCount so the long tail of un-rated prompts
    // doesn't all surface at rank 0.
    orderBy = sql`(${prompts.upvotes} - ${prompts.downvotes}) DESC, ${prompts.copyCount} DESC`;
  } else {
    orderBy =
      trimmed.length > 0
        ? sql`ts_rank(${tsDoc}, ${tsQuery}) DESC, ${prompts.copyCount} DESC`
        : desc(prompts.copyCount);
  }

  // Single query: data + total count via window function
  const rows = await db
    .select({
      ...listColumns,
      // Window function — COUNT over the full result set (before LIMIT/OFFSET)
      totalCount: sql<number>`COUNT(*) OVER()`.as("total_count"),
    })
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(whereCondition)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  // Extract total from first row (all rows have the same window count)
  const total = rows.length > 0 ? (rows[0] as { totalCount: number }).totalCount : 0;

  if (rows.length === 0) {
    return { results: [], total: 0, page, pageSize, hasMore: false };
  }

  const imageMap = await batchFetchPrimaryImages(rows);
  const results = toListItems(rows, imageMap);

  return {
    results,
    total,
    page,
    pageSize,
    hasMore: offset + pageSize < total,
  };
}

/* ── Detail page ─────────────────────────────────────────── */

export interface PromptDetail {
  id: string;
  slug: string;
  title: string;
  promptText: string;
  negativePrompt: string | null;
  expectedOutcome: string | null;
  tips: string | null;
  params: Record<string, unknown>;
  status: string;
  copyCount: number;
  upvotes: number;
  downvotes: number;
  viewCount: number;
  createdAt: Date;
  model: {
    id: string;
    slug: string;
    name: string;
    type: "image" | "text";
  };
  category: {
    id: string;
    slug: string;
    name: string;
  };
  images: Array<{
    id: string;
    cdnUrl: string;
    width: number;
    height: number;
    alt: string | null;
    position: number;
    isPrimary: boolean;
  }>;
}

/**
 * Fetch a single prompt by slug, with model + category + images joined.
 * Returns null if not found.
 *
 * Note: Detail page fetches full prompt_text (not truncated) since
 * the user needs the complete prompt for copying.
 */
export const getPromptBySlug = cache(_getPromptBySlug);

async function _getPromptBySlug(slug: string): Promise<PromptDetail | null> {
  const [row] = await db
    .select({
      id: prompts.id,
      slug: prompts.slug,
      title: prompts.title,
      promptText: prompts.promptText,
      negativePrompt: prompts.negativePrompt,
      expectedOutcome: prompts.expectedOutcome,
      tips: prompts.tips,
      params: prompts.params,
      status: prompts.status,
      copyCount: prompts.copyCount,
      upvotes: prompts.upvotes,
      downvotes: prompts.downvotes,
      viewCount: prompts.viewCount,
      createdAt: prompts.createdAt,
      modelId: models.id,
      modelSlug: models.slug,
      modelName: models.name,
      modelType: models.type,
      categoryId: categories.id,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .innerJoin(categories, eq(categories.id, prompts.categoryId))
    .where(and(eq(prompts.slug, slug), eq(prompts.status, "published")))
    .limit(1);

  if (!row) return null;

  // Fetch all images for this prompt (image-type only)
  const imageRows =
    row.modelType === "image"
      ? await db
          .select({
            id: images.id,
            cdnUrl: images.cdnUrl,
            width: images.width,
            height: images.height,
            alt: images.alt,
            position: images.position,
            isPrimary: images.isPrimary,
          })
          .from(images)
          .where(eq(images.promptId, row.id))
          .orderBy(asc(images.position))
      : [];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    promptText: row.promptText,
    negativePrompt: row.negativePrompt,
    expectedOutcome: row.expectedOutcome,
    tips: row.tips,
    params: (row.params ?? {}) as Record<string, unknown>,
    status: row.status,
    copyCount: row.copyCount,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    viewCount: row.viewCount,
    createdAt: row.createdAt,
    model: {
      id: row.modelId,
      slug: row.modelSlug,
      name: row.modelName,
      type: row.modelType as "image" | "text",
    },
    category: {
      id: row.categoryId,
      slug: row.categorySlug,
      name: row.categoryName,
    },
    images: imageRows,
  };
}

/**
 * Get related prompts: same category, same model type, excluding current.
 * Sorted by copy_count desc.
 *
 * Used as the fallback path for `getSimilarPrompts` when full-text search
 * returns nothing (e.g. a prompt with very rare title vocabulary).
 */
export async function getRelatedPrompts(
  currentPromptId: string,
  categoryId: string,
  modelType: "image" | "text",
  limit = 4,
): Promise<PromptListItem[]> {
  const rows = await db
    .select(listColumns)
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(
      and(
        eq(prompts.categoryId, categoryId),
        eq(models.type, modelType),
        eq(prompts.status, "published"),
        ne(prompts.id, currentPromptId),
      ),
    )
    .orderBy(desc(prompts.copyCount))
    .limit(limit);

  if (rows.length === 0) return [];

  const imageMap = await batchFetchPrimaryImages(rows);
  return toListItems(rows, imageMap);
}

/**
 * Find similar prompts using full-text search (FTS).
 *
 * How
 * ───
 * Builds a tsquery from the current prompt's title (most distinctive
 * field) and matches it against the GIN-indexed `search_doc` column on
 * every other published prompt. `ts_rank` orders by lexical similarity;
 * copy_count breaks ties so popular matches surface first.
 *
 * Strategy: AND → OR fallback
 *   First we try the AND-flavored `websearch_to_tsquery` (treats the
 *   title as a single phrase-y query). If that returns < ⅔ of the
 *   requested limit, we relax to OR by replacing every '&' in the
 *   compiled query with '|' — so any term matches, ordered by rank.
 *   This keeps results PRECISE for distinctive titles ("Cinematic
 *   Cyberpunk Portrait") while still returning useful matches for
 *   common ones ("Email Draft").
 *
 * Why the fallback to same-category
 *   Brand-new prompts whose title shares no vocabulary with anything
 *   in the catalog get an empty FTS result. The detail page calls
 *   `getSimilarPrompts` which folds in `getRelatedPrompts` to keep the
 *   "You might also like" section populated.
 */
export async function getSimilarPromptsViaFts(
  currentPromptId: string,
  query: string,
  limit = 6,
): Promise<PromptListItem[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  // Try a precise AND-style match first.
  const andRows = await runFtsSimilarity(currentPromptId, cleaned, limit, "and");
  if (andRows.length >= Math.max(2, Math.floor(limit * 2 / 3))) {
    return andRows;
  }

  // Relaxed OR-style — broader, useful for short/common titles.
  return runFtsSimilarity(currentPromptId, cleaned, limit, "or");
}

async function runFtsSimilarity(
  currentPromptId: string,
  query: string,
  limit: number,
  mode: "and" | "or",
): Promise<PromptListItem[]> {
  // Convert the natural-language query into a tsquery. websearch is the
  // friendliest variant — it handles quotes, OR, and minus signs.
  const tsQuery =
    mode === "and"
      ? sql`websearch_to_tsquery('english', ${query})`
      : // Compile to AND, then swap '&' for '|' to relax to OR.
        sql`replace(websearch_to_tsquery('english', ${query})::text, '&', '|')::tsquery`;

  const rows = await db
    .select({
      ...listColumns,
      rank: sql<number>`ts_rank(${prompts.searchDoc}, ${tsQuery})`.as("rank"),
    })
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(
      and(
        eq(prompts.status, "published"),
        ne(prompts.id, currentPromptId),
        sql`${prompts.searchDoc} @@ ${tsQuery}`,
      ),
    )
    .orderBy(sql`rank DESC, ${prompts.copyCount} DESC`)
    .limit(limit);

  if (rows.length === 0) return [];

  const imageMap = await batchFetchPrimaryImages(rows);
  return toListItems(rows, imageMap);
}

/**
 * Convenience wrapper: try FTS first, fall back to same-category if FTS
 * couldn't find enough. Always returns up to `limit` items.
 *
 * Detail page is the only caller; placing the orchestration in the
 * service keeps the page component thin.
 */
export async function getSimilarPrompts(
  currentPromptId: string,
  query: string,
  categoryId: string,
  modelType: "image" | "text",
  limit = 6,
): Promise<PromptListItem[]> {
  const fts = await getSimilarPromptsViaFts(currentPromptId, query, limit);
  if (fts.length >= limit) return fts;

  // Top up from same-category, excluding anything we already returned.
  const seen = new Set(fts.map((p) => p.id));
  const fallback = await getRelatedPrompts(
    currentPromptId,
    categoryId,
    modelType,
    limit,
  );
  for (const p of fallback) {
    if (seen.has(p.id) || fts.length >= limit) break;
    fts.push(p);
    seen.add(p.id);
  }
  return fts;
}

/**
 * Atomically increment a prompt's copy_count.
 *
 * @deprecated Prefer `queueCopyIncrement()` from `@/server/lib/counter-batcher`
 * for user-facing copy/view events — it coalesces concurrent bumps into a
 * single UPDATE every few seconds, eliminating row-level write contention
 * on hot prompts. Use this direct-write helper only when you need
 * immediate consistency (e.g. one-shot admin scripts or tests).
 */
export async function incrementCopyCount(promptId: string): Promise<void> {
  await db
    .update(prompts)
    .set({ copyCount: sql`${prompts.copyCount} + 1` })
    .where(eq(prompts.id, promptId));
}

/**
 * Atomically increment a prompt's view_count.
 *
 * @deprecated Prefer `queueViewIncrement()` from `@/server/lib/counter-batcher`.
 * See `incrementCopyCount` for rationale.
 */
export async function incrementViewCount(promptId: string): Promise<void> {
  await db
    .update(prompts)
    .set({ viewCount: sql`${prompts.viewCount} + 1` })
    .where(eq(prompts.id, promptId));
}
