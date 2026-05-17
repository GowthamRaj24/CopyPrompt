import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { promptRatings } from "@/server/models/prompt-rating.model";
import { prompts } from "@/server/models/prompt.model";

/**
 * Business logic for prompt ratings (👍 / 👎).
 *
 * Behaviour:
 *   - User can have one rating per prompt (dedup by user_id + prompt_id).
 *   - Same vote twice → no-op.
 *   - Opposite vote → flips the rating and adjusts both counters.
 *   - Switching vote: -1 from old bucket, +1 to new bucket.
 */

export type RatingValue = 1 | -1;

export interface RatingResult {
  rating: RatingValue | null;
  upvotes: number;
  downvotes: number;
}

/**
 * Cast / change / remove a rating.
 *
 * Wrapped in a transaction so the upvotes/downvotes counters on
 * `prompts` always reflect the actual rating rows.
 */
export async function ratePrompt(
  userId: string,
  promptId: string,
  rating: RatingValue,
): Promise<RatingResult> {
  return db.transaction(async (tx) => {
    // 1. Read existing rating, if any
    const [existing] = await tx
      .select({ rating: promptRatings.rating })
      .from(promptRatings)
      .where(
        and(
          eq(promptRatings.userId, userId),
          eq(promptRatings.promptId, promptId),
        ),
      )
      .limit(1);

    let upDelta = 0;
    let downDelta = 0;

    if (!existing) {
      // No prior rating → insert
      await tx.insert(promptRatings).values({
        userId,
        promptId,
        rating,
      });
      if (rating === 1) upDelta = 1;
      else downDelta = 1;
    } else if (existing.rating === rating) {
      // Same vote — no-op, return current counts
      const [counts] = await tx
        .select({
          upvotes: prompts.upvotes,
          downvotes: prompts.downvotes,
        })
        .from(prompts)
        .where(eq(prompts.id, promptId))
        .limit(1);
      return {
        rating,
        upvotes: counts?.upvotes ?? 0,
        downvotes: counts?.downvotes ?? 0,
      };
    } else {
      // Flip vote: update row + swap counters
      await tx
        .update(promptRatings)
        .set({ rating })
        .where(
          and(
            eq(promptRatings.userId, userId),
            eq(promptRatings.promptId, promptId),
          ),
        );
      if (rating === 1) {
        upDelta = 1;
        downDelta = -1;
      } else {
        upDelta = -1;
        downDelta = 1;
      }
    }

    // 2. Apply deltas to counters atomically (no underflow — clamp to 0)
    if (upDelta !== 0 || downDelta !== 0) {
      await tx
        .update(prompts)
        .set({
          upvotes: sql`GREATEST(${prompts.upvotes} + ${upDelta}, 0)`,
          downvotes: sql`GREATEST(${prompts.downvotes} + ${downDelta}, 0)`,
        })
        .where(eq(prompts.id, promptId));
    }

    // 3. Return fresh counts
    const [counts] = await tx
      .select({
        upvotes: prompts.upvotes,
        downvotes: prompts.downvotes,
      })
      .from(prompts)
      .where(eq(prompts.id, promptId))
      .limit(1);

    return {
      rating,
      upvotes: counts?.upvotes ?? 0,
      downvotes: counts?.downvotes ?? 0,
    };
  });
}

/**
 * Returns the user's current rating for a prompt, or null if they haven't rated it.
 */
export async function getUserRating(
  userId: string,
  promptId: string,
): Promise<RatingValue | null> {
  const [row] = await db
    .select({ rating: promptRatings.rating })
    .from(promptRatings)
    .where(
      and(
        eq(promptRatings.userId, userId),
        eq(promptRatings.promptId, promptId),
      ),
    )
    .limit(1);
  if (!row) return null;
  return (row.rating === 1 ? 1 : -1) as RatingValue;
}
