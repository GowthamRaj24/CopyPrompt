import { and, count, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { publicPublishedWhere } from "@/lib/prompt-visibility";
import {
  buildSearchHref as buildSearchHrefShared,
  describeSavedSearch as describeSavedSearchShared,
  type SavedSearchRow as SharedSavedSearchRow,
} from "@/lib/saved-search-shared";
import { db } from "@/server/lib/db";
import { assertCanCreateSavedSearch } from "@/server/lib/plan";
import type { AppUser } from "@/server/lib/auth";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";
import { savedSearches } from "@/server/models/saved-search.model";

// Re-export pure helpers + type so server callers keep their existing
// imports. The actual implementations live in `@/lib/saved-search-shared`
// so client components can import them without pulling in `postgres`.
export const buildSearchHref = buildSearchHrefShared;
export const describeSavedSearch = describeSavedSearchShared;
export type SavedSearchRow = SharedSavedSearchRow & {
  lastSeenAt: Date;
  createdAt: Date;
};

/**
 * Saved searches + digest matching.
 *
 * Two responsibilities:
 *   1. CRUD for the `/account/searches` UI and the inline "Save this search"
 *      button on `/search`. Plan-cap enforced server-side.
 *   2. Matching engine used by `/api/cron/saved-search-digest`. For each
 *      saved row we ask: "what published, public prompts have appeared
 *      since `last_seen_at` that satisfy these filters?" Limited to
 *      DIGEST_MATCH_LIMIT so a viral surge can't blow up email payloads.
 */

const DIGEST_MATCH_LIMIT = 5;

const VALID_TYPES = new Set(["all", "image", "text"]);
const VALID_SORTS = new Set([
  "relevance",
  "popular",
  "latest",
  "views",
  "rated",
]);

function normalizeType(value: string | null | undefined): string | null {
  if (!value) return null;
  return VALID_TYPES.has(value) && value !== "all" ? value : null;
}

function normalizeSort(value: string | null | undefined): string | null {
  if (!value) return null;
  return VALID_SORTS.has(value) ? value : null;
}

/* ── Reads ───────────────────────────────────────────────── */

export async function listSavedSearchesForUser(
  userId: string,
): Promise<SavedSearchRow[]> {
  const rows = await db
    .select({
      id: savedSearches.id,
      label: savedSearches.label,
      query: savedSearches.query,
      type: savedSearches.type,
      sort: savedSearches.sort,
      categorySlug: savedSearches.categorySlug,
      modelSlug: savedSearches.modelSlug,
      tagSlugs: savedSearches.tagSlugs,
      lastSeenAt: savedSearches.lastSeenAt,
      createdAt: savedSearches.createdAt,
    })
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
  return rows;
}

export async function countSavedSearches(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId));
  return row?.value ?? 0;
}

/* ── Writes ──────────────────────────────────────────────── */

export interface CreateSavedSearchInput {
  label?: string;
  query?: string;
  type?: string;
  sort?: string;
}

export async function createSavedSearch(
  user: AppUser,
  input: CreateSavedSearchInput,
): Promise<SavedSearchRow> {
  const query = (input.query ?? "").trim();
  const type = normalizeType(input.type);
  const sort = normalizeSort(input.sort);
  const labelRaw = (input.label ?? "").trim();

  if (!query && !type) {
    throw new Error("Add a search term or filter before saving.");
  }

  const label =
    (labelRaw || query || (type === "image" ? "New image prompts" : "New prompts"))
      .slice(0, 80);

  const current = await countSavedSearches(user.id);
  assertCanCreateSavedSearch(user, current);

  const [row] = await db
    .insert(savedSearches)
    .values({
      userId: user.id,
      label,
      query: query || null,
      type,
      sort,
    })
    .returning();

  if (!row) throw new Error("Could not save search");

  return {
    id: row.id,
    label: row.label,
    query: row.query,
    type: row.type,
    sort: row.sort,
    categorySlug: row.categorySlug,
    modelSlug: row.modelSlug,
    tagSlugs: row.tagSlugs,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
  };
}

export async function deleteSavedSearch(
  userId: string,
  id: string,
): Promise<void> {
  await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
}

/* ── Digest matching ─────────────────────────────────────── */

export interface DigestMatchPrompt {
  id: string;
  slug: string;
  title: string;
  modelName: string;
  modelType: "image" | "text";
  primaryImage: { cdnUrl: string } | null;
  createdAt: Date;
}

/**
 * Find published, public prompts created since `last_seen_at` that match
 * the saved search's filters. Capped at DIGEST_MATCH_LIMIT.
 *
 * Text matching reuses the existing `search_doc` GIN index when a query
 * is set; otherwise it's a straight "new since" filter.
 */
export async function findDigestMatches(
  row: SavedSearchRow,
): Promise<DigestMatchPrompt[]> {
  const conditions = [
    publicPublishedWhere(),
    gt(prompts.createdAt, row.lastSeenAt),
  ];

  if (row.type === "image" || row.type === "text") {
    conditions.push(eq(models.type, row.type));
  }

  if (row.query && row.query.trim()) {
    conditions.push(
      sql`${prompts.searchDoc} @@ websearch_to_tsquery('english', ${row.query})`,
    );
  }

  const rows = await db
    .select({
      id: prompts.id,
      slug: prompts.slug,
      title: prompts.title,
      modelType: models.type,
      modelName: models.name,
      createdAt: prompts.createdAt,
    })
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(and(...conditions))
    .orderBy(desc(prompts.createdAt))
    .limit(DIGEST_MATCH_LIMIT);

  if (rows.length === 0) return [];

  const imageIds = rows
    .filter((r) => r.modelType === "image")
    .map((r) => r.id);

  const primary =
    imageIds.length > 0
      ? await db
          .select({
            promptId: images.promptId,
            cdnUrl: images.cdnUrl,
          })
          .from(images)
          .where(
            and(eq(images.isPrimary, true), inArray(images.promptId, imageIds)),
          )
      : [];

  const imageByPromptId = new Map(primary.map((p) => [p.promptId, p]));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    modelName: r.modelName,
    modelType: r.modelType as "image" | "text",
    primaryImage: imageByPromptId.get(r.id) ?? null,
    createdAt: r.createdAt,
  }));
}

/** Walk the table for the cron — one Promise.all batch per user. */
export interface UserDigestPayload {
  userId: string;
  email: string;
  fullName: string | null;
  groups: Array<{
    saved: SavedSearchRow;
    matches: DigestMatchPrompt[];
  }>;
}

/**
 * Stamp `last_seen_at = now()` on a saved row. Called after a successful
 * email send so the next cron only surfaces newer prompts.
 */
export async function markSavedSearchDelivered(id: string): Promise<void> {
  await db
    .update(savedSearches)
    .set({ lastSeenAt: new Date() })
    .where(eq(savedSearches.id, id));
}

/**
 * Stream rows for the digest cron — joined to users for email + name.
 * Yields one batch per user so the email layer can build a single digest
 * containing all of a user's saved-search hits.
 */
export async function loadDigestBatches(): Promise<UserDigestPayload[]> {
  // Lazy import to avoid pulling users into the public client bundle if
  // this file ever gets bundled (it's server-only but defensive).
  const { users } = await import("@/server/models/user.model");

  const rows = await db
    .select({
      id: savedSearches.id,
      userId: savedSearches.userId,
      email: users.email,
      fullName: users.fullName,
      label: savedSearches.label,
      query: savedSearches.query,
      type: savedSearches.type,
      sort: savedSearches.sort,
      categorySlug: savedSearches.categorySlug,
      modelSlug: savedSearches.modelSlug,
      tagSlugs: savedSearches.tagSlugs,
      lastSeenAt: savedSearches.lastSeenAt,
      createdAt: savedSearches.createdAt,
    })
    .from(savedSearches)
    .innerJoin(users, eq(users.id, savedSearches.userId))
    .orderBy(savedSearches.userId);

  const byUser = new Map<string, UserDigestPayload>();
  for (const r of rows) {
    if (!byUser.has(r.userId)) {
      byUser.set(r.userId, {
        userId: r.userId,
        email: r.email,
        fullName: r.fullName,
        groups: [],
      });
    }
    const saved: SavedSearchRow = {
      id: r.id,
      label: r.label,
      query: r.query,
      type: r.type,
      sort: r.sort,
      categorySlug: r.categorySlug,
      modelSlug: r.modelSlug,
      tagSlugs: r.tagSlugs,
      lastSeenAt: r.lastSeenAt,
      createdAt: r.createdAt,
    };
    const matches = await findDigestMatches(saved);
    if (matches.length === 0) continue;
    byUser.get(r.userId)?.groups.push({ saved, matches });
  }

  // Drop users with zero match groups; nothing to send.
  return [...byUser.values()].filter((u) => u.groups.length > 0);
}
