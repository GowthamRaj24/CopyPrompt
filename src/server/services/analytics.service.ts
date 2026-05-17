import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/server/lib/db";
import { categories } from "@/server/models/category.model";
import { favorites } from "@/server/models/favorite.model";
import { models } from "@/server/models/model.model";
import { promptRatings } from "@/server/models/prompt-rating.model";
import { promptTags } from "@/server/models/prompt-tag.model";
import { prompts } from "@/server/models/prompt.model";
import { submissions } from "@/server/models/submission.model";
import { tags } from "@/server/models/tag.model";
import { users } from "@/server/models/user.model";

/**
 * First-party analytics service.
 *
 * Why first-party
 * ───────────────
 * Most "product analytics" SaaS (PostHog, Mixpanel, Amplitude) need either
 * paid tiers at our scale or a third-party script that hurts Lighthouse,
 * leaks user data, and breaks behind ad-blockers. Our own database already
 * holds every metric a small/mid-stage product needs:
 *
 *   - Signups (users.created_at)
 *   - Submissions (submissions.created_at + status)
 *   - Copies (prompts.copy_count, monotonic counter)
 *   - Views (prompts.view_count, monotonic counter)
 *   - Favorites (favorites.created_at)
 *   - Ratings (prompt_ratings.created_at)
 *   - Engagement (top prompts / categories / tags / models)
 *
 * Every helper here is wrapped in `React.cache()` so a single render of
 * the admin dashboard runs each query at most once even if multiple
 * components consume it.
 *
 * Costs scale linearly with DB rows. Up to ~100k prompts these queries
 * stay under 100ms each on Supabase free tier.
 */

export interface TimeSeriesPoint {
  /** ISO date (YYYY-MM-DD) in UTC */
  date: string;
  count: number;
}

export interface AdminTotals {
  prompts: number;
  publishedPrompts: number;
  users: number;
  submissions: number;
  pendingSubmissions: number;
  favorites: number;
  ratings: number;
  totalCopies: number;
  totalViews: number;
}

export interface PromptLeaderboardItem {
  id: string;
  slug: string;
  title: string;
  copyCount: number;
  viewCount: number;
  upvotes: number;
  downvotes: number;
  modelName: string;
  modelType: "image" | "text";
}

export interface CategoryLeaderboardItem {
  slug: string;
  name: string;
  promptCount: number;
  totalCopies: number;
}

export interface TagLeaderboardItem {
  slug: string;
  name: string;
  usageCount: number;
}

export interface ModelLeaderboardItem {
  slug: string;
  name: string;
  type: "image" | "text";
  promptCount: number;
}

/* ────────────────────────────────────────────────────────────
   Totals — single SELECT per table, no joins
   ──────────────────────────────────────────────────────────── */

export const getAdminTotals = cache(async (): Promise<AdminTotals> => {
  // Parallel everywhere — every query touches a different table.
  const [
    promptCounts,
    userCount,
    submissionCounts,
    favCount,
    ratingCount,
    copyAndViewSums,
  ] = await Promise.all([
    db
      .select({
        status: prompts.status,
        c: sql<number>`count(*)::int`,
      })
      .from(prompts)
      .groupBy(prompts.status),
    db.select({ c: sql<number>`count(*)::int` }).from(users),
    db
      .select({
        status: submissions.status,
        c: sql<number>`count(*)::int`,
      })
      .from(submissions)
      .groupBy(submissions.status),
    db.select({ c: sql<number>`count(*)::int` }).from(favorites),
    db.select({ c: sql<number>`count(*)::int` }).from(promptRatings),
    db
      .select({
        copies: sql<number>`coalesce(sum(${prompts.copyCount}), 0)::bigint`,
        views: sql<number>`coalesce(sum(${prompts.viewCount}), 0)::bigint`,
      })
      .from(prompts),
  ]);

  const publishedPrompts =
    promptCounts.find((r) => r.status === "published")?.c ?? 0;
  const totalPrompts = promptCounts.reduce((acc, r) => acc + r.c, 0);

  const pendingSubmissions =
    submissionCounts.find((r) => r.status === "pending")?.c ?? 0;
  const totalSubmissions = submissionCounts.reduce(
    (acc, r) => acc + r.c,
    0,
  );

  return {
    prompts: totalPrompts,
    publishedPrompts,
    users: userCount[0]?.c ?? 0,
    submissions: totalSubmissions,
    pendingSubmissions,
    favorites: favCount[0]?.c ?? 0,
    ratings: ratingCount[0]?.c ?? 0,
    totalCopies: Number(copyAndViewSums[0]?.copies ?? 0),
    totalViews: Number(copyAndViewSums[0]?.views ?? 0),
  };
});

/* ────────────────────────────────────────────────────────────
   Time series — daily counts over a window
   ──────────────────────────────────────────────────────────── */

/**
 * Generic daily-rollup helper.
 * Uses `date_trunc('day', ...)` which is index-friendly in Postgres.
 * Returns a continuous series (no gaps) for the requested window so
 * sparkline rendering doesn't need a date-fill loop on the client.
 */
async function dailySeries(
  table: typeof users | typeof submissions | typeof favorites,
  column: "createdAt",
  days: number,
): Promise<TimeSeriesPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle dynamic table reference
  const col = (table as any)[column];

  const rows = await db
    .select({
      d: sql<string>`to_char(date_trunc('day', ${col}), 'YYYY-MM-DD')`,
      c: sql<number>`count(*)::int`,
    })
    .from(table)
    .where(gte(col, since))
    .groupBy(sql`date_trunc('day', ${col})`)
    .orderBy(sql`date_trunc('day', ${col})`);

  // Fill missing days with zero counts so the line chart looks correct.
  const map = new Map(rows.map((r) => [r.d, r.c]));
  const out: TimeSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: map.get(key) ?? 0 });
  }
  return out;
}

export const getDailySignups = cache((days = 30) =>
  dailySeries(users, "createdAt", days),
);
export const getDailySubmissions = cache((days = 30) =>
  dailySeries(submissions, "createdAt", days),
);
export const getDailyFavorites = cache((days = 30) =>
  dailySeries(favorites, "createdAt", days),
);

/* ────────────────────────────────────────────────────────────
   Leaderboards
   ──────────────────────────────────────────────────────────── */

export const getTopPromptsByCopies = cache(
  async (limit = 10): Promise<PromptLeaderboardItem[]> => {
    const rows = await db
      .select({
        id: prompts.id,
        slug: prompts.slug,
        title: prompts.title,
        copyCount: prompts.copyCount,
        viewCount: prompts.viewCount,
        upvotes: prompts.upvotes,
        downvotes: prompts.downvotes,
        modelName: models.name,
        modelType: models.type,
      })
      .from(prompts)
      .innerJoin(models, eq(models.id, prompts.modelId))
      .where(eq(prompts.status, "published"))
      .orderBy(desc(prompts.copyCount))
      .limit(limit);
    return rows.map((r) => ({
      ...r,
      modelType: r.modelType as "image" | "text",
    }));
  },
);

export const getTopCategories = cache(
  async (limit = 8): Promise<CategoryLeaderboardItem[]> => {
    const rows = await db
      .select({
        slug: categories.slug,
        name: categories.name,
        promptCount: sql<number>`count(${prompts.id})::int`,
        totalCopies: sql<number>`coalesce(sum(${prompts.copyCount}), 0)::int`,
      })
      .from(categories)
      .leftJoin(
        prompts,
        and(
          eq(prompts.categoryId, categories.id),
          eq(prompts.status, "published"),
        ),
      )
      .groupBy(categories.id)
      .orderBy(desc(sql`count(${prompts.id})`))
      .limit(limit);
    return rows;
  },
);

export const getTopTags = cache(
  async (limit = 12): Promise<TagLeaderboardItem[]> => {
    // Sort by REAL usage (count of prompt_tags rows) rather than the
    // denormalized tags.usage_count, which can drift after rejections.
    const rows = await db
      .select({
        slug: tags.slug,
        name: tags.name,
        usageCount: sql<number>`count(${promptTags.promptId})::int`,
      })
      .from(tags)
      .leftJoin(promptTags, eq(promptTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(desc(sql`count(${promptTags.promptId})`))
      .limit(limit);
    return rows;
  },
);

export const getTopModels = cache(
  async (limit = 8): Promise<ModelLeaderboardItem[]> => {
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
        and(eq(prompts.modelId, models.id), eq(prompts.status, "published")),
      )
      .groupBy(models.id)
      .orderBy(desc(sql`count(${prompts.id})`))
      .limit(limit);
    return rows.map((r) => ({ ...r, type: r.type as "image" | "text" }));
  },
);

/* ────────────────────────────────────────────────────────────
   24h pulse — quick "what changed today" headline numbers
   ──────────────────────────────────────────────────────────── */

export interface DailyPulse {
  newUsers24h: number;
  newSubmissions24h: number;
  approvedPrompts24h: number;
  newFavorites24h: number;
  newRatings24h: number;
}

export const getDailyPulse = cache(async (): Promise<DailyPulse> => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [newUsers, newSubs, approved, newFavs, newRatings] = await Promise.all(
    [
      db
        .select({ c: count() })
        .from(users)
        .where(gte(users.createdAt, since)),
      db
        .select({ c: count() })
        .from(submissions)
        .where(gte(submissions.createdAt, since)),
      db
        .select({ c: count() })
        .from(submissions)
        .where(
          and(
            eq(submissions.status, "approved"),
            gte(submissions.reviewedAt, since),
          ),
        ),
      db
        .select({ c: count() })
        .from(favorites)
        .where(gte(favorites.createdAt, since)),
      db
        .select({ c: count() })
        .from(promptRatings)
        .where(gte(promptRatings.createdAt, since)),
    ],
  );

  return {
    newUsers24h: Number(newUsers[0]?.c ?? 0),
    newSubmissions24h: Number(newSubs[0]?.c ?? 0),
    approvedPrompts24h: Number(approved[0]?.c ?? 0),
    newFavorites24h: Number(newFavs[0]?.c ?? 0),
    newRatings24h: Number(newRatings[0]?.c ?? 0),
  };
});
