import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/server/lib/db";
import { favorites } from "@/server/models/favorite.model";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";
import type { PromptListItem } from "@/server/services/prompt.service";

/**
 * Business logic for user favorites.
 * All operations require a userId — auth is enforced in the controller layer.
 */

/**
 * Returns true if this user has favorited this prompt.
 */
export async function isFavorited(
  userId: string,
  promptId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.promptId, promptId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Returns the set of prompt IDs the user has favorited, optionally
 * scoped to a specific list of prompt IDs.
 *
 * Always scope when you only need to render a finite grid — otherwise
 * a power user with 10k favorites will pull 10k IDs per page load.
 *
 * If `promptIds` is omitted or empty, returns ALL favorites for the user.
 * (Used by /favorites — there we genuinely need everything.)
 *
 * Memoized per-request via React.cache() so repeated calls in the same
 * render are deduped. Note: cache key is by reference for the array, so
 * pass the same array reference (or undefined) to hit the cache.
 */
export const getUserFavoriteIds = cache(
  async (userId: string, promptIds?: string[]): Promise<Set<string>> => {
    // Special case: empty scope → return empty set without hitting the DB.
    if (promptIds && promptIds.length === 0) {
      return new Set();
    }

    const conditions = [eq(favorites.userId, userId)];
    if (promptIds && promptIds.length > 0) {
      conditions.push(inArray(favorites.promptId, promptIds));
    }

    const rows = await db
      .select({ promptId: favorites.promptId })
      .from(favorites)
      .where(and(...conditions));

    return new Set(rows.map((r) => r.promptId));
  },
);

/**
 * Returns the full list of prompt IDs a user has favorited.
 * Used by the `/api/favorites/me` batch endpoint that hydrates the
 * client-side `FavoritesProvider` once per session.
 *
 * Even a power user with 10k favorites only produces a ~360KB payload
 * (uuid strings + JSON overhead) and this fetch happens at most once
 * per browser tab — vastly cheaper than N per-card lookups.
 */
export async function getAllUserFavoriteIds(
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ promptId: favorites.promptId })
    .from(favorites)
    .where(eq(favorites.userId, userId));

  return rows.map((r) => r.promptId);
}

/**
 * Add a favorite (idempotent — silently no-op if already exists).
 */
export async function addFavorite(
  userId: string,
  promptId: string,
): Promise<void> {
  await db
    .insert(favorites)
    .values({ userId, promptId })
    .onConflictDoNothing();
}

/**
 * Remove a favorite (idempotent — no-op if not present).
 */
export async function removeFavorite(
  userId: string,
  promptId: string,
): Promise<void> {
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.promptId, promptId)));
}

/**
 * Fetch a user's favorites with full prompt data for the /favorites page.
 * Joined with model + primary image, sorted by most-recently-favorited.
 *
 * Optimizations:
 *   - Truncated prompt_text (280 chars) via SQL LEFT()
 *   - Batch image fetch (1 extra query)
 */
export async function getUserFavorites(
  userId: string,
  limit = 100,
): Promise<PromptListItem[]> {
  const rows = await db
    .select({
      id: prompts.id,
      slug: prompts.slug,
      title: prompts.title,
      promptText: sql<string>`LEFT(${prompts.promptText}, 280)`.as("prompt_text_preview"),
      expectedOutcome: prompts.expectedOutcome,
      copyCount: prompts.copyCount,
      upvotes: prompts.upvotes,
      modelName: models.name,
      modelSlug: models.slug,
      modelType: models.type,
      favoritedAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(prompts, eq(prompts.id, favorites.promptId))
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];

  // Batch-fetch primary image for image-type prompts only
  const imagePromptIds = rows
    .filter((r) => r.modelType === "image")
    .map((r) => r.id);

  const primaryImages =
    imagePromptIds.length > 0
      ? await db
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
          )
      : [];

  const imageByPromptId = new Map(
    primaryImages.map((img) => [img.promptId, img]),
  );

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
    primaryImage: imageByPromptId.get(r.id) ?? null,
  }));
}
