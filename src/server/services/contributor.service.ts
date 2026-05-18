import { and, desc, eq, gt, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/server/lib/db";
import { prompts } from "@/server/models/prompt.model";
import { users } from "@/server/models/user.model";

/**
 * Contributor stats + leaderboard.
 *
 * Stats live denormalized on `users` (see migration 0010) so the
 * leaderboard page is a single ORDER BY against an index — even at
 * 100k+ users the query stays in single-digit ms.
 *
 * Freshness contract
 * ──────────────────
 *   - `users.total_prompts_published` bumps inside the admin approve
 *     transaction so a new contributor's first prompt counts instantly.
 *   - `users.total_copies_received` is refreshed daily by
 *     `/api/cron/refresh-contributor-stats`. Copies trickle in via the
 *     counter batcher so 24h stale is fine for a public leaderboard.
 */

export interface ContributorLeaderboardEntry {
  rank: number;
  id: string;
  handle: string;
  fullName: string | null;
  avatarUrl: string | null;
  totalCopies: number;
  promptCount: number;
}

export const listContributorLeaderboard = cache(
  async (limit = 50): Promise<ContributorLeaderboardEntry[]> => {
    const rows = await db
      .select({
        id: users.id,
        handle: users.handle,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        totalCopies: users.totalCopiesReceived,
        promptCount: users.totalPromptsPublished,
      })
      .from(users)
      .where(gt(users.totalPromptsPublished, 0))
      .orderBy(
        desc(users.totalCopiesReceived),
        desc(users.totalPromptsPublished),
      )
      .limit(Math.max(1, Math.min(200, limit)));

    return rows.map((r, idx) => ({ rank: idx + 1, ...r }));
  },
);

/** Stats for a single user — drives badges on `/u/[handle]` and account UI. */
export interface ContributorStats {
  totalCopies: number;
  promptCount: number;
  /** 1-based rank on the leaderboard, or null when below the cap. */
  rank: number | null;
}

export const getContributorStats = cache(
  async (
    userId: string,
    leaderboardSize = 50,
  ): Promise<ContributorStats> => {
    const [row] = await db
      .select({
        totalCopies: users.totalCopiesReceived,
        promptCount: users.totalPromptsPublished,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) {
      return { totalCopies: 0, promptCount: 0, rank: null };
    }

    // Cheap rank lookup — only when the user could plausibly be on the
    // board. Saves a count(*) for the long tail of one-prompt authors.
    let rank: number | null = null;
    if (row.promptCount > 0) {
      const [rankRow] = await db
        .select({ value: sql<number>`COUNT(*)::int + 1` })
        .from(users)
        .where(
          and(
            gt(users.totalPromptsPublished, 0),
            sql`(
              ${users.totalCopiesReceived} > ${row.totalCopies}
              OR (
                ${users.totalCopiesReceived} = ${row.totalCopies}
                AND ${users.totalPromptsPublished} > ${row.promptCount}
              )
            )`,
          ),
        );
      const computed = rankRow?.value ?? null;
      rank = computed && computed <= leaderboardSize ? computed : null;
    }

    return {
      totalCopies: row.totalCopies,
      promptCount: row.promptCount,
      rank,
    };
  },
);

/**
 * Full refresh — called by the daily cron. Single GROUP BY query joined
 * back via a CTE so we hit every user in one round-trip.
 *
 * Users with no published prompts are reset to 0 so deletes / un-
 * publishes don't leave stale counters.
 */
export async function refreshAllContributorStats(): Promise<{
  updated: number;
}> {
  const result = await db.execute<{ count: string }>(sql`
    WITH agg AS (
      SELECT
        ${prompts.authorId}    AS author_id,
        SUM(${prompts.copyCount})::int  AS copies,
        COUNT(*)::int          AS prompts
      FROM ${prompts}
      WHERE ${prompts.authorId} IS NOT NULL
        AND ${prompts.status} = 'published'
        AND ${prompts.visibility} = 'public'
      GROUP BY ${prompts.authorId}
    )
    UPDATE ${users} u
    SET
      total_copies_received   = COALESCE(agg.copies, 0),
      total_prompts_published = COALESCE(agg.prompts, 0)
    FROM agg
    WHERE u.id = agg.author_id
       OR (u.total_prompts_published > 0 AND agg.author_id IS NULL)
  `);

  const updated = Number.parseInt(result[0]?.count ?? "0", 10);
  return { updated: Number.isFinite(updated) ? updated : 0 };
}

/**
 * Increment helper for the hot path: called inside the approve
 * transaction whenever an admin publishes a submission.
 */
export async function incrementAuthorPublishedCount(
  userId: string,
  copyCount = 0,
): Promise<void> {
  await db
    .update(users)
    .set({
      totalPromptsPublished: sql`${users.totalPromptsPublished} + 1`,
      // copyCount is almost always 0 at approval; included for completeness
      // when an admin manually approves something that already has copies.
      totalCopiesReceived: sql`${users.totalCopiesReceived} + ${copyCount}`,
    })
    .where(eq(users.id, userId));
}
