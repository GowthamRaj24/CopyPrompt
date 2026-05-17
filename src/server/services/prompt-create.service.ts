import { eq, sql } from "drizzle-orm";
import { PROMPT_VISIBILITY } from "@/lib/prompt-visibility";
import { generateShareToken } from "@/lib/share-token";
import { db } from "@/server/lib/db";
import { probeImageDimensions } from "@/server/lib/image-dimensions";
import { categories } from "@/server/models/category.model";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { promptTags } from "@/server/models/prompt-tag.model";
import { prompts } from "@/server/models/prompt.model";
import { tags } from "@/server/models/tag.model";
import type { SubmissionInput } from "@/server/validators/submission.validator";

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugifyTitle(title) || "prompt";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: prompts.id })
      .from(prompts)
      .where(eq(prompts.slug, candidate))
      .limit(1);

    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
    if (suffix > 100) {
      throw new Error("Could not generate unique slug after 100 attempts");
    }
  }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function buildParams(input: SubmissionInput): Record<string, unknown> {
  if (input.type === "image") {
    return stripUndefined({
      aspect_ratio: input.aspectRatio,
      steps: input.steps,
      guidance: input.guidance,
      seed: input.seed,
    });
  }
  return stripUndefined({
    temperature: input.temperature,
    max_tokens: input.maxTokens,
    system_message: input.systemMessage,
  });
}

export interface CreatePromptResult {
  id: string;
  slug: string;
  shareToken: string | null;
}

/**
 * Insert a published prompt from submission form data (used for instant private
 * create and can be reused when approving public submissions).
 */
export async function createPromptFromSubmission(
  input: SubmissionInput,
  options: {
    authorId: string;
    visibility: "public" | "private";
  },
): Promise<CreatePromptResult> {
  const [model] = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.slug, input.modelSlug))
    .limit(1);
  if (!model) throw new Error(`Model not found: ${input.modelSlug}`);

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, input.categorySlug))
    .limit(1);
  if (!category) throw new Error(`Category not found: ${input.categorySlug}`);

  const slug = await generateUniqueSlug(input.title);
  const shareToken =
    options.visibility === PROMPT_VISIBILITY.PRIVATE
      ? generateShareToken()
      : null;

  const imageUrls =
    input.type === "image" ? (input.imageUrls ?? []) : [];
  const imageDimensions =
    input.type === "image" && imageUrls.length > 0
      ? await Promise.all(imageUrls.map((url) => probeImageDimensions(url)))
      : [];

  let promptId: string | undefined;

  await db.transaction(async (tx) => {
    const [newPrompt] = await tx
      .insert(prompts)
      .values({
        slug,
        title: input.title,
        promptText: input.promptText,
        negativePrompt:
          input.type === "image" ? (input.negativePrompt ?? null) : null,
        expectedOutcome:
          input.type === "text" ? input.expectedOutcome : null,
        modelId: model.id,
        categoryId: category.id,
        authorId: options.authorId,
        params: buildParams(input),
        tips: input.tips ?? null,
        status: "published",
        visibility: options.visibility,
        shareToken,
      })
      .returning({ id: prompts.id });

    if (!newPrompt) throw new Error("Failed to insert prompt");
    promptId = newPrompt.id;

    if (input.type === "image" && imageUrls.length > 0) {
      await tx.insert(images).values(
        imageUrls.map((url, idx) => {
          const dims = imageDimensions[idx] ?? { width: 800, height: 800 };
          return {
            promptId: newPrompt.id,
            r2Key: `submitted/${newPrompt.id}-${idx}`,
            cdnUrl: url,
            width: dims.width,
            height: dims.height,
            alt: `${input.title} - image ${idx + 1}`,
            position: idx,
            isPrimary: idx === 0,
          };
        }),
      );
    }

    const tagSlugs = [...new Set(input.tags ?? [])];
    if (tagSlugs.length > 0) {
      const upserted = await tx
        .insert(tags)
        .values(
          tagSlugs.map((tagSlug) => ({
            slug: tagSlug,
            name: tagSlug.replace(/-/g, " "),
            usageCount: 1,
          })),
        )
        .onConflictDoUpdate({
          target: tags.slug,
          set: { usageCount: sql`${tags.usageCount} + 1` },
        })
        .returning({ id: tags.id });

      if (upserted.length > 0) {
        await tx
          .insert(promptTags)
          .values(
            upserted.map((tag) => ({
              promptId: newPrompt.id,
              tagId: tag.id,
            })),
          )
          .onConflictDoNothing();
      }
    }

    await tx
      .update(models)
      .set({ promptCount: sql`${models.promptCount} + 1` })
      .where(eq(models.id, model.id));
  });

  if (!promptId) throw new Error("Failed to create prompt");

  return { id: promptId, slug, shareToken };
}
