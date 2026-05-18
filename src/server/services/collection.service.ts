import { randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";
import { slicePage, pageOffset } from "@/lib/pagination";
import { db } from "@/server/lib/db";
import {
  assertCanAddPromptToCollection,
  assertCanCreateCollection,
} from "@/server/lib/plan";
import { collectionPrompts } from "@/server/models/collection-prompt.model";
import { collections } from "@/server/models/collection.model";
import { images } from "@/server/models/image.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";
import { users } from "@/server/models/user.model";
import type { AppUser } from "@/server/lib/auth";
import type { PromptListItem } from "@/server/services/prompt.service";

/**
 * Business logic for collections (Step 2 of retention roadmap).
 *
 * Conventions:
 *   - All write helpers require an `AppUser` from `requireUser()` /
 *     `getCurrentUser()` so plan caps can be enforced server-side.
 *   - Read helpers expose what the UI needs without leaking owner-only
 *     fields (e.g. private collections fetched by slug must check
 *     `isPublic` in the caller layer).
 *   - Slugs combine a sanitized name with a 6-char random suffix so two
 *     users can both name a board "Saved" without collision.
 */

export interface CollectionListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isCurated: boolean;
  promptCount: number;
  coverImageUrl: string | null;
  updatedAt: Date;
}

const SLUG_SUFFIX_BYTES = 4; // ~6 base64url chars

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function makeSlug(name: string): string {
  const base = slugifyName(name) || "board";
  const suffix = randomBytes(SLUG_SUFFIX_BYTES)
    .toString("base64url")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toLowerCase();
  return `${base}-${suffix}`;
}

/* ── Reads ───────────────────────────────────────────────── */

/** All collections owned by a user with denormalized prompt counts. */
export const listMyCollections = cache(
  async (userId: string): Promise<CollectionListItem[]> => {
    const rows = await db
      .select({
        id: collections.id,
        slug: collections.slug,
        name: collections.name,
        description: collections.description,
        isPublic: collections.isPublic,
        isCurated: collections.isCurated,
        coverImageUrl: collections.coverImageUrl,
        updatedAt: collections.updatedAt,
        promptCount: sql<number>`COALESCE(COUNT(${collectionPrompts.promptId}), 0)::int`.as(
          "prompt_count",
        ),
      })
      .from(collections)
      .leftJoin(
        collectionPrompts,
        eq(collectionPrompts.collectionId, collections.id),
      )
      .where(eq(collections.ownerId, userId))
      .groupBy(collections.id)
      .orderBy(desc(collections.updatedAt));

    return rows;
  },
);

/** Count of collections owned by a user (used for cap enforcement). */
export async function countMyCollections(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(collections)
    .where(eq(collections.ownerId, userId));
  return row?.value ?? 0;
}

/**
 * Which of the current user's collections already contain this prompt?
 * Drives the "save to collection" picker checkboxes.
 */
export async function getCollectionsForPrompt(
  userId: string,
  promptId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ collectionId: collectionPrompts.collectionId })
    .from(collectionPrompts)
    .innerJoin(
      collections,
      eq(collections.id, collectionPrompts.collectionId),
    )
    .where(
      and(
        eq(collections.ownerId, userId),
        eq(collectionPrompts.promptId, promptId),
      ),
    );
  return new Set(rows.map((r) => r.collectionId));
}

/** Fetch a single collection by id and assert ownership. Returns null if not found / not owner. */
export async function getOwnedCollection(
  userId: string,
  collectionId: string,
): Promise<CollectionListItem | null> {
  const [row] = await db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
      isPublic: collections.isPublic,
      isCurated: collections.isCurated,
      coverImageUrl: collections.coverImageUrl,
      updatedAt: collections.updatedAt,
      promptCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${collectionPrompts} WHERE ${collectionPrompts.collectionId} = ${collections.id}), 0)::int`.as(
        "prompt_count",
      ),
    })
    .from(collections)
    .where(
      and(eq(collections.id, collectionId), eq(collections.ownerId, userId)),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Public read by slug. Returns the collection only if it is public OR curated,
 * plus its owner display info. Used by `/c/[slug]`.
 */
export async function getPublicCollectionBySlug(slug: string): Promise<{
  collection: CollectionListItem;
  owner: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
} | null> {
  const [row] = await db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
      isPublic: collections.isPublic,
      isCurated: collections.isCurated,
      coverImageUrl: collections.coverImageUrl,
      updatedAt: collections.updatedAt,
      ownerId: collections.ownerId,
      ownerFullName: users.fullName,
      ownerAvatarUrl: users.avatarUrl,
    })
    .from(collections)
    .leftJoin(users, eq(users.id, collections.ownerId))
    .where(eq(collections.slug, slug))
    .limit(1);

  if (!row) return null;
  if (!row.isPublic && !row.isCurated) return null;

  const [pc] = await db
    .select({ value: count() })
    .from(collectionPrompts)
    .where(eq(collectionPrompts.collectionId, row.id));

  return {
    collection: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      isPublic: row.isPublic,
      isCurated: row.isCurated,
      coverImageUrl: row.coverImageUrl,
      updatedAt: row.updatedAt,
      promptCount: pc?.value ?? 0,
    },
    owner: row.ownerId
      ? {
          id: row.ownerId,
          fullName: row.ownerFullName,
          avatarUrl: row.ownerAvatarUrl,
        }
      : null,
  };
}

/**
 * Paginated members of a collection — joins prompts + primary images so
 * the shape matches `PromptListItem` used by all our grids.
 */
export interface CollectionPromptsPage {
  results: PromptListItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function listPromptsInCollection(
  collectionId: string,
  page = 1,
  pageSize = 24,
): Promise<CollectionPromptsPage> {
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
      position: collectionPrompts.position,
    })
    .from(collectionPrompts)
    .innerJoin(prompts, eq(prompts.id, collectionPrompts.promptId))
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(
      and(
        eq(collectionPrompts.collectionId, collectionId),
        eq(prompts.status, "published"),
        eq(prompts.visibility, "public"),
      ),
    )
    .orderBy(asc(collectionPrompts.position), desc(prompts.createdAt))
    .limit(fetchLimit)
    .offset(offset);

  const { items: slice, hasMore } = slicePage(rows, pageSize);
  if (slice.length === 0) {
    return { results: [], page, pageSize, hasMore: false };
  }

  const imageIds = slice
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
    results: slice.map((r) => ({
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

/* ── Writes ──────────────────────────────────────────────── */

export interface CreateCollectionInput {
  name: string;
  description?: string | null;
  isPublic?: boolean;
}

export async function createCollection(
  user: AppUser,
  input: CreateCollectionInput,
): Promise<CollectionListItem> {
  const name = input.name.trim();
  if (!name) throw new Error("Collection name is required");
  if (name.length > 80) throw new Error("Collection name is too long (max 80)");

  const current = await countMyCollections(user.id);
  assertCanCreateCollection(user, current);

  const slug = await ensureUniqueSlug(name);

  const [row] = await db
    .insert(collections)
    .values({
      slug,
      name,
      description: input.description ?? null,
      ownerId: user.id,
      isPublic: input.isPublic ?? false,
      isCurated: false,
    })
    .returning();

  if (!row) throw new Error("Failed to create collection");

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isPublic: row.isPublic,
    isCurated: row.isCurated,
    coverImageUrl: row.coverImageUrl,
    updatedAt: row.updatedAt,
    promptCount: 0,
  };
}

/** Retry-on-collision unique slug. Collisions are vanishingly rare with 6 random chars. */
async function ensureUniqueSlug(name: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = makeSlug(name);
    const [row] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, candidate))
      .limit(1);
    if (!row) return candidate;
  }
  // Last resort — use a longer suffix.
  return `${slugifyName(name) || "board"}-${randomBytes(8).toString("hex").slice(0, 10)}`;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
}

export async function updateCollection(
  user: AppUser,
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<CollectionListItem> {
  const existing = await getOwnedCollection(user.id, collectionId);
  if (!existing) throw new Error("Collection not found");

  const patch: Partial<typeof collections.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) throw new Error("Name cannot be empty");
    if (trimmed.length > 80) throw new Error("Name too long (max 80)");
    patch.name = trimmed;
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }
  if (input.isPublic !== undefined) {
    patch.isPublic = input.isPublic;
  }

  await db.update(collections).set(patch).where(eq(collections.id, collectionId));

  const updated = await getOwnedCollection(user.id, collectionId);
  if (!updated) throw new Error("Collection vanished mid-update");
  return updated;
}

export async function deleteCollection(
  user: AppUser,
  collectionId: string,
): Promise<void> {
  const existing = await getOwnedCollection(user.id, collectionId);
  if (!existing) throw new Error("Collection not found");
  // ON DELETE CASCADE on collection_prompts cleans up membership rows.
  await db.delete(collections).where(eq(collections.id, collectionId));
}

/**
 * Add a prompt to a collection.
 * - Idempotent: re-adding is a no-op.
 * - Enforces per-collection cap (count BEFORE insert to avoid race).
 * - Updates `collections.updated_at` so the list re-orders.
 */
export async function addPromptToCollection(
  user: AppUser,
  collectionId: string,
  promptId: string,
): Promise<void> {
  const owned = await getOwnedCollection(user.id, collectionId);
  if (!owned) throw new Error("Collection not found");

  // Already a member? Treat as success.
  const [existing] = await db
    .select({ promptId: collectionPrompts.promptId })
    .from(collectionPrompts)
    .where(
      and(
        eq(collectionPrompts.collectionId, collectionId),
        eq(collectionPrompts.promptId, promptId),
      ),
    )
    .limit(1);
  if (existing) return;

  assertCanAddPromptToCollection(user, owned.promptCount);

  // Append to the end.
  const [maxRow] = await db
    .select({ max: sql<number>`COALESCE(MAX(${collectionPrompts.position}), -1)` })
    .from(collectionPrompts)
    .where(eq(collectionPrompts.collectionId, collectionId));
  const nextPosition = (maxRow?.max ?? -1) + 1;

  await db
    .insert(collectionPrompts)
    .values({ collectionId, promptId, position: nextPosition })
    .onConflictDoNothing();

  await db
    .update(collections)
    .set({ updatedAt: new Date() })
    .where(eq(collections.id, collectionId));
}

/** Remove a prompt from a collection. Idempotent. */
export async function removePromptFromCollection(
  user: AppUser,
  collectionId: string,
  promptId: string,
): Promise<void> {
  const owned = await getOwnedCollection(user.id, collectionId);
  if (!owned) throw new Error("Collection not found");

  await db
    .delete(collectionPrompts)
    .where(
      and(
        eq(collectionPrompts.collectionId, collectionId),
        eq(collectionPrompts.promptId, promptId),
      ),
    );

  await db
    .update(collections)
    .set({ updatedAt: new Date() })
    .where(eq(collections.id, collectionId));
}

/**
 * Curated collections shown on the homepage + /collections index.
 * Sorted by recency so editorial picks rotate naturally.
 */
export async function listCuratedCollections(
  limit = 12,
): Promise<
  Array<
    CollectionListItem & {
      ownerHandle: string | null;
      ownerName: string | null;
    }
  >
> {
  const rows = await db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
      isPublic: collections.isPublic,
      isCurated: collections.isCurated,
      coverImageUrl: collections.coverImageUrl,
      updatedAt: collections.updatedAt,
      ownerHandle: users.handle,
      ownerName: users.fullName,
      promptCount: sql<number>`COALESCE(COUNT(${collectionPrompts.promptId}), 0)::int`.as(
        "prompt_count",
      ),
    })
    .from(collections)
    .leftJoin(users, eq(users.id, collections.ownerId))
    .leftJoin(
      collectionPrompts,
      eq(collectionPrompts.collectionId, collections.id),
    )
    .where(and(eq(collections.isCurated, true), eq(collections.isPublic, true)))
    .groupBy(collections.id, users.handle, users.fullName)
    .orderBy(desc(collections.updatedAt))
    .limit(Math.max(1, Math.min(48, limit)));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    isPublic: r.isPublic,
    isCurated: r.isCurated,
    coverImageUrl: r.coverImageUrl,
    updatedAt: r.updatedAt,
    promptCount: r.promptCount,
    ownerHandle: r.ownerHandle ?? null,
    ownerName: r.ownerName ?? null,
  }));
}

/**
 * Popular public boards (non-curated) — sorted by prompt count desc.
 * Used as the second strip on `/collections` after curated picks.
 */
export async function listPopularPublicCollections(
  limit = 24,
): Promise<
  Array<
    CollectionListItem & {
      ownerHandle: string | null;
      ownerName: string | null;
    }
  >
> {
  const rows = await db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
      isPublic: collections.isPublic,
      isCurated: collections.isCurated,
      coverImageUrl: collections.coverImageUrl,
      updatedAt: collections.updatedAt,
      ownerHandle: users.handle,
      ownerName: users.fullName,
      promptCount: sql<number>`COALESCE(COUNT(${collectionPrompts.promptId}), 0)::int`.as(
        "prompt_count",
      ),
    })
    .from(collections)
    .leftJoin(users, eq(users.id, collections.ownerId))
    .leftJoin(
      collectionPrompts,
      eq(collectionPrompts.collectionId, collections.id),
    )
    .where(eq(collections.isPublic, true))
    .groupBy(collections.id, users.handle, users.fullName)
    .having(sql`COUNT(${collectionPrompts.promptId}) >= 5`)
    .orderBy(
      desc(sql`COUNT(${collectionPrompts.promptId})`),
      desc(collections.updatedAt),
    )
    .limit(Math.max(1, Math.min(48, limit)));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    isPublic: r.isPublic,
    isCurated: r.isCurated,
    coverImageUrl: r.coverImageUrl,
    updatedAt: r.updatedAt,
    promptCount: r.promptCount,
    ownerHandle: r.ownerHandle ?? null,
    ownerName: r.ownerName ?? null,
  }));
}

/**
 * Admin queue: all public collections (curated + non-curated), with
 * the curated flag exposed so the admin UI can flip it.
 */
export interface AdminCollectionRow extends CollectionListItem {
  ownerHandle: string | null;
  ownerName: string | null;
}

export async function listPublicCollectionsForAdmin(
  limit = 100,
): Promise<AdminCollectionRow[]> {
  const rows = await db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
      isPublic: collections.isPublic,
      isCurated: collections.isCurated,
      coverImageUrl: collections.coverImageUrl,
      updatedAt: collections.updatedAt,
      ownerHandle: users.handle,
      ownerName: users.fullName,
      promptCount: sql<number>`COALESCE(COUNT(${collectionPrompts.promptId}), 0)::int`.as(
        "prompt_count",
      ),
    })
    .from(collections)
    .leftJoin(users, eq(users.id, collections.ownerId))
    .leftJoin(
      collectionPrompts,
      eq(collectionPrompts.collectionId, collections.id),
    )
    .where(eq(collections.isPublic, true))
    .groupBy(collections.id, users.handle, users.fullName)
    .orderBy(desc(collections.isCurated), desc(collections.updatedAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    isPublic: r.isPublic,
    isCurated: r.isCurated,
    coverImageUrl: r.coverImageUrl,
    updatedAt: r.updatedAt,
    promptCount: r.promptCount,
    ownerHandle: r.ownerHandle ?? null,
    ownerName: r.ownerName ?? null,
  }));
}

/** Admin-only: flip a collection's `is_curated` flag. */
export async function setCollectionCurated(
  collectionId: string,
  isCurated: boolean,
): Promise<void> {
  await db
    .update(collections)
    .set({ isCurated, updatedAt: new Date() })
    .where(eq(collections.id, collectionId));
}

/**
 * Slugs of public collections worth indexing — used by sitemap.
 * Only includes boards with at least 3 prompts to avoid thin pages.
 */
export async function getIndexableCollectionSlugs(): Promise<string[]> {
  const rows = await db
    .select({
      slug: collections.slug,
      promptCount: sql<number>`COUNT(${collectionPrompts.promptId})::int`.as(
        "prompt_count",
      ),
    })
    .from(collections)
    .leftJoin(
      collectionPrompts,
      eq(collectionPrompts.collectionId, collections.id),
    )
    .where(eq(collections.isPublic, true))
    .groupBy(collections.id)
    .having(sql`COUNT(${collectionPrompts.promptId}) >= 3`);
  return rows.map((r) => r.slug);
}

/**
 * Lazy default "Saved" board.
 * If the user has zero collections, create one and return its id.
 * Used by the SaveToCollectionButton so the very first save flow has no
 * "create a board first" friction.
 */
export async function ensureDefaultCollection(
  user: AppUser,
): Promise<string> {
  const mine = await listMyCollections(user.id);
  if (mine.length > 0) return mine[0]!.id;
  const created = await createCollection(user, {
    name: "Saved",
    description: "Your default board",
    isPublic: false,
  });
  return created.id;
}
