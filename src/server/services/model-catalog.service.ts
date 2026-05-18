import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";
import { pageOffset, slicePage } from "@/lib/pagination";
import { publicPublishedWhere } from "@/lib/prompt-visibility";
import { PAGINATION } from "@/server/config/constants";
import { db } from "@/server/lib/db";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";
import type { PromptListItem } from "@/server/services/prompt.service";

export interface ModelDetail {
  id: string;
  slug: string;
  name: string;
  type: "image" | "text";
}

export const getModelBySlug = cache(
  async (slug: string): Promise<ModelDetail | null> => {
    const [row] = await db
      .select({
        id: models.id,
        slug: models.slug,
        name: models.name,
        type: models.type,
      })
      .from(models)
      .where(eq(models.slug, slug))
      .limit(1);

    if (!row) return null;
    return { ...row, type: row.type as "image" | "text" };
  },
);

const modelListColumns = {
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

async function mapModelRows(
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

export interface ModelPromptsPage {
  results: PromptListItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getPromptsByModelPage(options: {
  modelId: string;
  sort?: "popular" | "latest";
  page?: number;
  pageSize?: number;
}): Promise<ModelPromptsPage> {
  const {
    modelId,
    sort = "popular",
    page = 1,
    pageSize = PAGINATION.CATEGORY_PAGE_SIZE,
  } = options;

  const orderBy =
    sort === "latest" ? desc(prompts.createdAt) : desc(prompts.copyCount);
  const offset = pageOffset(page, pageSize);
  const fetchLimit = pageSize + 1;

  const rows = await db
    .select(modelListColumns)
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(and(eq(prompts.modelId, modelId), publicPublishedWhere()))
    .orderBy(orderBy)
    .limit(fetchLimit)
    .offset(offset);

  const { items, hasMore } = slicePage(rows, pageSize);
  const results = await mapModelRows(items);

  return { results, page, pageSize, hasMore };
}

/** Models with at least one published prompt. */
export async function getIndexableModels(): Promise<
  Array<{
    slug: string;
    name: string;
    type: "image" | "text";
    promptCount: number;
  }>
> {
  const rows = await db
    .select({
      slug: models.slug,
      name: models.name,
      type: models.type,
      promptCount: sql<number>`count(${prompts.id})::int`,
    })
    .from(models)
    .leftJoin(
      prompts,
      and(eq(prompts.modelId, models.id), publicPublishedWhere()),
    )
    .groupBy(models.id, models.slug, models.name, models.type)
    .having(sql`count(${prompts.id}) > 0`)
    .orderBy(desc(sql`count(${prompts.id})`));

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    type: r.type as "image" | "text",
    promptCount: r.promptCount,
  }));
}
