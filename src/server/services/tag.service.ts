import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";
import { pageOffset, slicePage } from "@/lib/pagination";
import { publicPublishedWhere } from "@/lib/prompt-visibility";
import { PAGINATION } from "@/server/config/constants";
import { db } from "@/server/lib/db";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { promptTags } from "@/server/models/prompt-tag.model";
import { prompts } from "@/server/models/prompt.model";
import { tags } from "@/server/models/tag.model";
import type { PromptListItem } from "@/server/services/prompt.service";

export interface TagDetail {
  id: string;
  slug: string;
  name: string;
}

export const getTagBySlug = cache(
  async (slug: string): Promise<TagDetail | null> => {
    const [row] = await db
      .select({
        id: tags.id,
        slug: tags.slug,
        name: tags.name,
      })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);
    return row ?? null;
  },
);

const tagListColumns = {
  id: prompts.id,
  slug: prompts.slug,
  title: prompts.title,
  promptText: sql<string>`LEFT(${prompts.promptText}, 280)`.as(
    "prompt_text_preview",
  ),
  expectedOutcome: prompts.expectedOutcome,
  copyCount: prompts.copyCount,
  upvotes: prompts.upvotes,
  modelName: models.name,
  modelSlug: models.slug,
  modelType: models.type,
} as const;

async function mapTagRows(
  rows: Array<{
    id: string;
    slug: string;
    title: string;
    promptText: string;
    expectedOutcome: string | null;
    copyCount: number;
    upvotes: number;
    modelName: string;
    modelSlug: string;
    modelType: string;
  }>,
): Promise<PromptListItem[]> {
  if (rows.length === 0) return [];

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

export interface TagPromptsPage {
  results: PromptListItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getPromptsByTagPage(options: {
  tagId: string;
  sort?: "popular" | "latest";
  page?: number;
  pageSize?: number;
}): Promise<TagPromptsPage> {
  const {
    tagId,
    sort = "popular",
    page = 1,
    pageSize = PAGINATION.CATEGORY_PAGE_SIZE,
  } = options;

  const orderBy =
    sort === "latest" ? desc(prompts.createdAt) : desc(prompts.copyCount);
  const offset = pageOffset(page, pageSize);
  const fetchLimit = pageSize + 1;

  const rows = await db
    .select(tagListColumns)
    .from(promptTags)
    .innerJoin(prompts, eq(prompts.id, promptTags.promptId))
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(and(eq(promptTags.tagId, tagId), publicPublishedWhere()))
    .orderBy(orderBy)
    .limit(fetchLimit)
    .offset(offset);

  const { items, hasMore } = slicePage(rows, pageSize);
  const results = await mapTagRows(items);

  return { results, page, pageSize, hasMore };
}

/** Tags with at least one published prompt — for homepage / sitemap. */
export async function getIndexableTags(limit = 48): Promise<
  Array<{ slug: string; name: string; promptCount: number }>
> {
  const rows = await db
    .select({
      slug: tags.slug,
      name: tags.name,
      promptCount: sql<number>`count(${prompts.id})::int`,
    })
    .from(tags)
    .innerJoin(promptTags, eq(promptTags.tagId, tags.id))
    .innerJoin(prompts, eq(prompts.id, promptTags.promptId))
    .where(publicPublishedWhere())
    .groupBy(tags.id)
    .having(sql`count(${prompts.id}) > 0`)
    .orderBy(desc(sql`count(${prompts.id})`))
    .limit(limit);

  return rows;
}

/**
 * Slugs of tags worth indexing. Excludes tags with fewer than 3 published
 * prompts — those tag pages look like thin duplicates of the prompt page
 * itself to Google and waste crawl budget.
 */
export async function getAllTagSlugsForSitemap(): Promise<
  Array<{ slug: string }>
> {
  const rows = await db
    .select({ slug: tags.slug })
    .from(tags)
    .innerJoin(promptTags, eq(promptTags.tagId, tags.id))
    .innerJoin(prompts, eq(prompts.id, promptTags.promptId))
    .where(publicPublishedWhere())
    .groupBy(tags.id, tags.slug)
    .having(sql`count(${prompts.id}) >= 3`);

  return rows;
}
