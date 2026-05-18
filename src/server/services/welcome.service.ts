import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { sendWelcomeEmail } from "@/server/lib/email";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";
import { users } from "@/server/models/user.model";
import { publicPublishedWhere } from "@/lib/prompt-visibility";

/**
 * Welcome-email orchestration.
 *
 * Concurrent requests for the same fresh user race to send a welcome.
 * We resolve it with an atomic UPDATE:
 *
 *   UPDATE users SET welcomed_at = now()
 *   WHERE id = $1 AND welcomed_at IS NULL
 *   RETURNING id;
 *
 * The first request "claims" the welcome and sends the email; every
 * other request that arrived in the same window sees zero rows and
 * silently skips. No queue / lock infrastructure required.
 */

/**
 * Returns the 3 most-copied prompts to seed the welcome email body.
 * Cached for a request — but this fires at most once per user so the
 * cache is mostly defensive.
 */
async function getStarterPromptsForWelcome(): Promise<
  Array<{ title: string; slug: string; modelName: string }>
> {
  const rows = await db
    .select({
      title: prompts.title,
      slug: prompts.slug,
      copyCount: prompts.copyCount,
      modelName: models.name,
    })
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .where(publicPublishedWhere())
    .orderBy(desc(prompts.copyCount))
    .limit(3);

  return rows.map((r) => ({
    title: r.title,
    slug: r.slug,
    modelName: r.modelName,
  }));
}

/**
 * Fire-and-forget welcome email path.
 *
 * Call this whenever a signed-in user is observed without a value in
 * `welcomed_at`. Safe to call concurrently and repeatedly; the atomic
 * claim guarantees the email is sent at most once.
 */
export async function welcomeIfFirstSignIn(opts: {
  userId: string;
  email: string;
  fullName: string | null;
}): Promise<void> {
  try {
    // Atomic claim. RETURNING-0 means somebody else already welcomed them.
    const claimed = await db
      .update(users)
      .set({ welcomedAt: new Date() })
      .where(and(eq(users.id, opts.userId), isNull(users.welcomedAt)))
      .returning({ id: users.id });

    if (claimed.length === 0) return;

    const starterPrompts = await getStarterPromptsForWelcome();
    if (starterPrompts.length === 0) {
      // No catalog to recommend — still send a no-prompts welcome so the
      // user gets the brand touch. (Empty list renders as zero cards.)
    }

    await sendWelcomeEmail({
      to: opts.email,
      name: opts.fullName,
      starterPrompts,
    });
  } catch (err) {
    // Roll back the claim on failure so the next request can retry.
    try {
      await db
        .update(users)
        .set({ welcomedAt: null })
        .where(eq(users.id, opts.userId));
    } catch (rollbackErr) {
      console.error("[welcome] rollback failed:", rollbackErr);
    }
    console.error("[welcome] send failed:", err);
  }
}
