import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cache } from "react";
import { db } from "@/server/lib/db";
import { categories } from "@/server/models/category.model";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";
import type { PromptListItem } from "@/server/services/prompt.service";

/**
 * Business logic for categories.
 *
 * All read functions are wrapped in `React.cache()` so duplicate calls
 * within the same render are deduplicated to a single round-trip.
 */

export interface CategoryDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  parentSlug: string | null;
}

/**
 * Fetch a single category by slug, joined with parent category (if any).
 *
 * One round-trip: a single SELECT with a self LEFT JOIN on parent_id.
 * (Previous implementation fired a second query whenever a parent existed.)
 */
export const getCategoryBySlug = cache(
  async (slug: string): Promise<CategoryDetail | null> => {
    const parent = alias(categories, "parent");

    const [row] = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        parentId: categories.parentId,
        parentName: parent.name,
        parentSlug: parent.slug,
      })
      .from(categories)
      .leftJoin(parent, eq(parent.id, categories.parentId))
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      parentId: row.parentId,
      parentName: row.parentName ?? null,
      parentSlug: row.parentSlug ?? null,
    };
  },
);

/**
 * Fetch published prompts for a category.
 * Sort options: popular (copy_count desc) | latest (created_at desc).
 *
 * Optimizations:
 *   - Truncated prompt_text (280 chars) via SQL LEFT()
 *   - Batch image fetch (1 extra query)
 */
export async function getPromptsByCategory(options: {
  categoryId: string;
  sort?: "popular" | "latest";
  limit?: number;
}): Promise<PromptListItem[]> {
  const { categoryId, sort = "popular", limit = 60 } = options;

  const orderBy =
    sort === "latest" ? desc(prompts.createdAt) : desc(prompts.copyCount);

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
    })
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(
      and(
        eq(prompts.categoryId, categoryId),
        eq(prompts.status, "published"),
      ),
    )
    .orderBy(orderBy)
    .limit(limit);

  if (rows.length === 0) return [];

  // Batch-fetch primary images for image-type prompts
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

/**
 * List all categories (sub-categories included), alphabetically.
 * Used for sidebars / nav menus.
 */
export async function getAllCategories(): Promise<
  Array<{ id: string; slug: string; name: string; parentId: string | null }>
> {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      parentId: categories.parentId,
    })
    .from(categories)
    .orderBy(asc(categories.name));
}
