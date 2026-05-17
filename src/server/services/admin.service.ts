import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { pageOffset, slicePage } from "@/lib/pagination";
import { PAGINATION } from "@/server/config/constants";
import { db } from "@/server/lib/db";
import { probeImageDimensions } from "@/server/lib/image-dimensions";
import { categories } from "@/server/models/category.model";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { promptTags } from "@/server/models/prompt-tag.model";
import { prompts } from "@/server/models/prompt.model";
import { submissions } from "@/server/models/submission.model";
import { tags } from "@/server/models/tag.model";

/**
 * Admin business logic. All these functions assume the caller has already
 * been auth-checked via requireAdmin().
 */

export interface PendingSubmissionListItem {
  id: string;
  promptData: {
    type: "image" | "text";
    title: string;
    promptText: string;
    expectedOutcome?: string | null;
    modelSlug: string;
    categorySlug: string;
    tags: string[];
    tips?: string | null;
    negativePrompt?: string | null;
    imageUrls?: string[];
    params?: Record<string, unknown>;
  };
  email: string | null;
  createdAt: Date;
}

/**
 * List submissions filtered by status, sorted oldest-first (FIFO queue).
 */
export interface SubmissionsPage {
  items: PendingSubmissionListItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function listSubmissionsPage(
  status: "pending" | "approved" | "rejected" = "pending",
  page = 1,
  pageSize: number = PAGINATION.ADMIN_QUEUE_PAGE_SIZE,
): Promise<SubmissionsPage> {
  const offset = pageOffset(page, pageSize);
  const fetchLimit = pageSize + 1;

  const rows = await db
    .select({
      id: submissions.id,
      promptData: submissions.promptData,
      email: submissions.email,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(eq(submissions.status, status))
    .orderBy(asc(submissions.createdAt))
    .limit(fetchLimit)
    .offset(offset);

  const { items: slice, hasMore } = slicePage(rows, pageSize);
  const items = slice.map((r) => ({
    id: r.id,
    promptData: r.promptData as PendingSubmissionListItem["promptData"],
    email: r.email,
    createdAt: r.createdAt,
  }));

  return { items, page, pageSize, hasMore };
}

/** @deprecated Use listSubmissionsPage */
export async function listSubmissionsByStatus(
  status: "pending" | "approved" | "rejected" = "pending",
  limit = 50,
): Promise<PendingSubmissionListItem[]> {
  const { items } = await listSubmissionsPage(status, 1, limit);
  return items;
}

export async function getSubmissionCounts(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
}> {
  const rows = await db
    .select({
      status: submissions.status,
      count: sql<number>`count(*)::int`,
    })
    .from(submissions)
    .groupBy(submissions.status);

  const result = { pending: 0, approved: 0, rejected: 0 };
  for (const r of rows) {
    if (r.status in result) {
      result[r.status as keyof typeof result] = r.count;
    }
  }
  return result;
}

/**
 * Approve a submission: create the prompt, images, tags, and revalidate caches.
 * Wrapped in a transaction so partial failures don't leave orphan data.
 */
export async function approveSubmission(
  submissionId: string,
  reviewerId: string,
): Promise<{ slug: string }> {
  const [submission] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.id, submissionId),
        eq(submissions.status, "pending"),
      ),
    )
    .limit(1);

  if (!submission) {
    throw new Error("Submission not found or already processed");
  }

  const data = submission.promptData as PendingSubmissionListItem["promptData"];

  // Look up model + category by slug
  const [model] = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.slug, data.modelSlug))
    .limit(1);
  if (!model) throw new Error(`Model not found: ${data.modelSlug}`);

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, data.categorySlug))
    .limit(1);
  if (!category) throw new Error(`Category not found: ${data.categorySlug}`);

  // Generate a unique slug from the title
  const slug = await generateUniqueSlug(data.title);

  // Probe image dimensions BEFORE the transaction — network calls inside
  // a DB transaction can hold connections open too long. We do this in
  // parallel for speed.
  const imageDimensions =
    data.type === "image" && data.imageUrls && data.imageUrls.length > 0
      ? await Promise.all(data.imageUrls.map((url) => probeImageDimensions(url)))
      : [];

  let approvedPromptId: string | undefined;

  // Transaction: insert prompt + images + tags atomically
  await db.transaction(async (tx) => {
    // 1. Insert prompt
    const [newPrompt] = await tx
      .insert(prompts)
      .values({
        slug,
        title: data.title,
        promptText: data.promptText,
        negativePrompt: data.negativePrompt ?? null,
        expectedOutcome: data.expectedOutcome ?? null,
        modelId: model.id,
        categoryId: category.id,
        params: stripUndefined(data.params ?? {}),
        tips: data.tips ?? null,
        status: "published",
        visibility: "public",
        shareToken: null,
      })
      .returning({ id: prompts.id });

    if (!newPrompt) throw new Error("Failed to insert prompt");
    approvedPromptId = newPrompt.id;

    // 2. Insert images (only for image-type submissions)
    if (data.type === "image" && data.imageUrls && data.imageUrls.length > 0) {
      await tx.insert(images).values(
        data.imageUrls.map((url, idx) => {
          const dims = imageDimensions[idx] ?? { width: 800, height: 800 };
          return {
            promptId: newPrompt.id,
            // For now: r2_key is just the URL (we'll move to R2 storage later)
            r2Key: `submitted/${newPrompt.id}-${idx}`,
            cdnUrl: url,
            width: dims.width,
            height: dims.height,
            alt: `${data.title} - image ${idx + 1}`,
            position: idx,
            isPrimary: idx === 0,
          };
        }),
      );
    }

    // 3. Upsert tags + junctions in batch (was N sequential round-trips)
    const tagSlugs = [...new Set(data.tags ?? [])];
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

    // 4. Mark submission as approved
    await tx
      .update(submissions)
      .set({
        status: "approved",
        reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId));

    // 5. Bump the model's prompt_count
    await tx
      .update(models)
      .set({ promptCount: sql`${models.promptCount} + 1` })
      .where(eq(models.id, model.id));
  });

  // Revalidate caches outside the transaction
  revalidatePath("/");
  revalidatePath(`/category/${data.categorySlug}`);
  revalidatePath(`/model/${data.modelSlug}`);

  if (approvedPromptId) {
    const { refreshPromptEmbedding } = await import(
      "@/server/services/embedding.service"
    );
    void refreshPromptEmbedding(approvedPromptId).catch((err) => {
      console.error("[embedding] approve:", err);
    });
  }

  return { slug };
}

export async function rejectSubmission(
  submissionId: string,
  reviewerId: string,
  reason: string,
): Promise<void> {
  const result = await db
    .update(submissions)
    .set({
      status: "rejected",
      reviewerId,
      rejectionReason: reason.trim() || null,
      reviewedAt: new Date(),
    })
    .where(
      and(
        eq(submissions.id, submissionId),
        eq(submissions.status, "pending"),
      ),
    )
    .returning({ id: submissions.id });

  if (result.length === 0) {
    throw new Error("Submission not found or already processed");
  }
}

/* ── Helpers ─────────────────────────────────────────────── */

/**
 * Slugify a title: "Cinematic Cyberpunk Portrait" -> "cinematic-cyberpunk-portrait"
 */
function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Generate a slug guaranteed unique in the prompts table.
 * Appends -2, -3, etc. on collision.
 */
async function generateUniqueSlug(title: string): Promise<string> {
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

    // Safety bail-out — should never hit
    if (suffix > 100) {
      throw new Error("Could not generate unique slug after 100 attempts");
    }
  }
}

/** Strip undefined values from an object (Postgres jsonb doesn't accept them) */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}
