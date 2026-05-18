import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";
import { pageOffset, slicePage } from "@/lib/pagination";
import { publicPublishedWhere } from "@/lib/prompt-visibility";
import { db } from "@/server/lib/db";
import { isValidHandle, normalizeHandle } from "@/server/lib/handle";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";
import { users } from "@/server/models/user.model";
import type { PromptListItem } from "@/server/services/prompt.service";

/**
 * Creator profile service.
 *
 * Powers:
 *   - `/u/[handle]` public profile page
 *   - `/account` profile editor
 *   - Future contributor leaderboard (Step 10) reuses `getCreatorStats`
 */

export interface CreatorProfile {
  id: string;
  handle: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
}

export interface CreatorStats {
  promptCount: number;
  totalCopies: number;
}

export const getCreatorByHandle = cache(
  async (handle: string): Promise<CreatorProfile | null> => {
    const lower = normalizeHandle(handle);
    if (!isValidHandle(lower)) return null;
    const [row] = await db
      .select({
        id: users.id,
        handle: users.handle,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(sql`lower(${users.handle}) = ${lower}`)
      .limit(1);
    return row ?? null;
  },
);

export const getCreatorById = cache(
  async (userId: string): Promise<CreatorProfile | null> => {
    const [row] = await db
      .select({
        id: users.id,
        handle: users.handle,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row ?? null;
  },
);

/**
 * Aggregate counters across the creator's published, public prompts.
 * Cheap; relies on `prompts.copy_count` already maintained by the
 * counter batcher.
 */
export async function getCreatorStats(userId: string): Promise<CreatorStats> {
  const [row] = await db
    .select({
      promptCount: sql<number>`COUNT(*)::int`,
      totalCopies: sql<number>`COALESCE(SUM(${prompts.copyCount}), 0)::int`,
    })
    .from(prompts)
    .where(and(eq(prompts.authorId, userId), publicPublishedWhere()));
  return {
    promptCount: row?.promptCount ?? 0,
    totalCopies: row?.totalCopies ?? 0,
  };
}

export interface CreatorPromptsPage {
  results: PromptListItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function listCreatorPrompts(
  userId: string,
  page = 1,
  pageSize = 24,
): Promise<CreatorPromptsPage> {
  const offset = pageOffset(page, pageSize);
  const fetchLimit = pageSize + 1;

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
    .where(and(eq(prompts.authorId, userId), publicPublishedWhere()))
    .orderBy(desc(prompts.copyCount), desc(prompts.createdAt))
    .limit(fetchLimit)
    .offset(offset);

  const { items, hasMore } = slicePage(rows, pageSize);
  if (items.length === 0) {
    return { results: [], page, pageSize, hasMore: false };
  }

  const imageIds = items
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

  return {
    results: items.map((r) => ({
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
    })),
    page,
    pageSize,
    hasMore,
  };
}

export interface UpdateProfileInput {
  handle?: string;
  fullName?: string | null;
  bio?: string | null;
}

export class HandleTakenError extends Error {
  constructor() {
    super("That handle is already taken.");
    this.name = "HandleTakenError";
  }
}

export class InvalidHandleError extends Error {
  constructor() {
    super("Handle must be 3–32 chars: letters, numbers, dash, underscore.");
    this.name = "InvalidHandleError";
  }
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<CreatorProfile> {
  const patch: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.handle !== undefined) {
    const normalized = normalizeHandle(input.handle);
    if (!isValidHandle(normalized)) throw new InvalidHandleError();
    // Case-insensitive uniqueness check.
    const [clash] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          sql`lower(${users.handle}) = ${normalized}`,
          // Allow re-saving the same handle the user already owns.
          sql`${users.id} <> ${userId}`,
        ),
      )
      .limit(1);
    if (clash) throw new HandleTakenError();
    patch.handle = normalized;
  }

  if (input.fullName !== undefined) {
    const trimmed = (input.fullName ?? "").trim();
    patch.fullName = trimmed.length > 0 ? trimmed.slice(0, 80) : null;
  }

  if (input.bio !== undefined) {
    const trimmed = (input.bio ?? "").trim();
    patch.bio = trimmed.length > 0 ? trimmed.slice(0, 280) : null;
  }

  await db.update(users).set(patch).where(eq(users.id, userId));

  const updated = await getCreatorById(userId);
  if (!updated) throw new Error("User vanished mid-update");
  return updated;
}

/**
 * Slugs of creators with at least one published prompt — used by sitemap
 * + future homepage "spotlight" surfaces. Tied to copy count desc so the
 * sitemap stays useful even when we cap it.
 */
export async function listIndexableCreatorHandles(
  limit = 1000,
): Promise<string[]> {
  const rows = await db
    .select({
      handle: users.handle,
      copies: sql<number>`COALESCE(SUM(${prompts.copyCount}), 0)::int`,
    })
    .from(users)
    .innerJoin(
      prompts,
      and(eq(prompts.authorId, users.id), publicPublishedWhere()),
    )
    .groupBy(users.id, users.handle)
    .having(sql`COUNT(${prompts.id}) > 0`)
    .orderBy(desc(sql`COALESCE(SUM(${prompts.copyCount}), 0)`))
    .limit(limit);
  return rows.map((r) => r.handle);
}

/** Lightweight count used by gating UI / future leaderboard pagination. */
export async function countCreatorsWithPublishedPrompts(): Promise<number> {
  const [row] = await db
    .select({ value: count(sql`DISTINCT ${prompts.authorId}`) })
    .from(prompts)
    .where(
      and(
        publicPublishedWhere(),
        sql`${prompts.authorId} IS NOT NULL`,
      ),
    );
  return row?.value ?? 0;
}
