import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";
import { promptCopies } from "@/server/models/prompt-copy.model";
import type { PromptListItem } from "@/server/services/prompt.service";

/**
 * Per-user copy history (Step 1 of retention roadmap).
 *
 * Conventions match `favorite.service.ts`:
 *   - All reads scoped to a `userId`.
 *   - `PromptListItem` shape so existing grids/rails render unchanged.
 *   - DISTINCT ON drops repeat copies of the same prompt — we surface
 *     the LAST copy time per prompt so the rail does not fill up with
 *     the same item if the user copies it twice in 10 seconds.
 */

const PROMPT_COPIES_RETENTION_DAYS = 30;

/**
 * Record a copy event for an authenticated user.
 * Fire-and-forget: errors are logged but never propagated to the caller.
 */
export async function recordCopyForUser(
  userId: string,
  promptId: string,
): Promise<void> {
  try {
    await db.insert(promptCopies).values({ userId, promptId });
  } catch (err) {
    console.error("[recent-copies] record failed:", err);
  }
}

/**
 * Distinct prompts most recently copied by this user, joined to prompts +
 * models and the primary image — matches the homepage rail's shape.
 *
 * Drops rows for prompts that have since been hidden/unpublished or
 * made private so the timeline never points at dead URLs.
 */
export async function listRecentCopiedPrompts(
  userId: string,
  limit = 8,
): Promise<PromptListItem[]> {
  try {
    return await listRecentCopiedPromptsInner(userId, limit);
  } catch (err) {
    console.error("[recent-copies] list failed:", err);
    return [];
  }
}

async function listRecentCopiedPromptsInner(
  userId: string,
  limit = 8,
): Promise<PromptListItem[]> {
  // Step 1: pick the latest copy event per prompt for this user.
  // Using DISTINCT ON keeps this to a single index scan on
  // (user_id, created_at DESC). Cap aggressively so dense users with
  // hundreds of events do not pull a huge subquery.
  const recentRows = await db.execute<{
    prompt_id: string;
    last_copied: Date;
  }>(sql`
    SELECT DISTINCT ON (prompt_id) prompt_id, created_at AS last_copied
    FROM ${promptCopies}
    WHERE user_id = ${userId}
    ORDER BY prompt_id, created_at DESC
    LIMIT ${Math.max(1, Math.min(64, limit * 3))}
  `);

  if (recentRows.length === 0) return [];

  const ids = recentRows.map((r) => r.prompt_id);
  const lastCopiedByPrompt = new Map<string, Date>(
    recentRows.map((r) => [r.prompt_id, r.last_copied]),
  );

  // Step 2: hydrate prompts in one query.
  const rows = await db
    .select({
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
    })
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(
      and(
        inArray(prompts.id, ids),
        eq(prompts.status, "published"),
        eq(prompts.visibility, "public"),
      ),
    );

  // Re-sort by last_copied desc (the SELECT lost that ordering) and trim.
  const ordered = rows
    .map((r) => ({
      ...r,
      lastCopied: lastCopiedByPrompt.get(r.id) ?? new Date(0),
    }))
    .sort((a, b) => b.lastCopied.getTime() - a.lastCopied.getTime())
    .slice(0, limit);

  if (ordered.length === 0) return [];

  // Step 3: batch primary images for image-type prompts.
  const imageIds = ordered
    .filter((r) => r.modelType === "image")
    .map((r) => r.id);

  const primaryImages =
    imageIds.length > 0
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
            and(eq(images.isPrimary, true), inArray(images.promptId, imageIds)),
          )
      : [];

  const imageByPromptId = new Map(
    primaryImages.map((img) => [img.promptId, img]),
  );

  return ordered.map((r) => ({
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

/** Wipe a user's entire copy history (Account → Clear history button). */
export async function clearUserCopyHistory(userId: string): Promise<void> {
  await db.delete(promptCopies).where(eq(promptCopies.userId, userId));
}

/**
 * Cron: delete rows older than the retention window.
 * Returns the number of rows deleted (for logging).
 */
export async function prunePromptCopies(): Promise<number> {
  const cutoff = new Date(
    Date.now() - PROMPT_COPIES_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  const result = await db
    .delete(promptCopies)
    .where(lt(promptCopies.createdAt, cutoff))
    .returning({ id: promptCopies.id });
  return result.length;
}

export { PROMPT_COPIES_RETENTION_DAYS };
