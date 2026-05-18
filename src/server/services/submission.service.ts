import { asc, desc } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { categories } from "@/server/models/category.model";
import { models } from "@/server/models/model.model";
import { submissions } from "@/server/models/submission.model";
import { tags } from "@/server/models/tag.model";
import type { SubmissionInput } from "@/server/validators/submission.validator";

/**
 * Business logic for prompt submissions.
 */

export interface ModelOption {
  slug: string;
  name: string;
  type: "image" | "text";
}

export interface CategoryOption {
  slug: string;
  name: string;
}

/**
 * Fetch all models for the submit form dropdown.
 * Sorted by type then name.
 */
export async function getModelsForSelect(): Promise<ModelOption[]> {
  const rows = await db
    .select({
      slug: models.slug,
      name: models.name,
      type: models.type,
    })
    .from(models)
    .orderBy(asc(models.type), asc(models.name));

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    type: r.type as "image" | "text",
  }));
}

/**
 * Fetch all categories for the submit form dropdown.
 */
export async function getCategoriesForSelect(): Promise<CategoryOption[]> {
  return db
    .select({ slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));
}

/**
 * Fetch popular tags for autocomplete suggestions in the submit form.
 * Sorted by usage_count descending. Falls back to empty if no tags exist.
 */
export async function getPopularTags(limit = 30): Promise<string[]> {
  const rows = await db
    .select({ slug: tags.slug })
    .from(tags)
    .orderBy(desc(tags.usageCount), asc(tags.slug))
    .limit(limit);

  return rows.map((r) => r.slug);
}

/**
 * Insert a new submission. Status starts as 'pending' awaiting admin review.
 *
 * Stores ALL form data in the `prompt_data` jsonb so we don't lose anything,
 * and the admin's approve handler decides which fields make it into the
 * real `prompts` table.
 *
 * The submission is tied to the authenticated user (the route requires auth).
 */
export async function createSubmission(
  input: SubmissionInput,
  meta: { userId: string; userEmail: string; ipAddress?: string; userAgent?: string },
): Promise<{ id: string }> {
  // Reusable bag for the jsonb column - every form field goes in here
  const promptData: Record<string, unknown> = {
    type: input.type,
    title: input.title,
    promptText: input.promptText,
    modelSlug: input.modelSlug,
    categorySlug: input.categorySlug,
    tags: input.tags ?? [],
    tips: input.tips || null,
    remixSourceId: input.remixSourceId ?? null,
    submittedFromIp: meta.ipAddress,
    submittedUserAgent: meta.userAgent,
  };

  if (input.type === "image") {
    promptData.negativePrompt = input.negativePrompt || null;
    promptData.imageUrls = input.imageUrls;
    promptData.params = {
      aspect_ratio: input.aspectRatio,
      steps: input.steps,
      guidance: input.guidance,
      seed: input.seed,
    };
  } else {
    promptData.expectedOutcome = input.expectedOutcome;
    promptData.params = {
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      system_message: input.systemMessage,
    };
  }

  const [row] = await db
    .insert(submissions)
    .values({
      userId: meta.userId,
      email: meta.userEmail,
      promptData,
      status: "pending",
    })
    .returning({ id: submissions.id });

  if (!row) {
    throw new Error("Failed to insert submission");
  }

  return { id: row.id };
}
