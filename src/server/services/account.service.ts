import { desc, eq } from "drizzle-orm";
import { db } from "@/server/lib/db";
import { supabaseAdmin } from "@/server/lib/supabase-admin";
import { favorites } from "@/server/models/favorite.model";
import { promptRatings } from "@/server/models/prompt-rating.model";
import { prompts } from "@/server/models/prompt.model";
import { submissions } from "@/server/models/submission.model";
import { users } from "@/server/models/user.model";

/**
 * Account-management business logic.
 *
 * Implements two legally-required operations:
 *
 *   1. Data Export — GDPR Art. 20 (Right to portability)
 *      DPDP Act §11 (Right to access — India)
 *      A user must be able to take their data with them in a machine-
 *      readable format. We return a single JSON document containing every
 *      row in our database that references their account.
 *
 *   2. Account Deletion — GDPR Art. 17 (Right to erasure)
 *      DPDP Act §12
 *      A user must be able to wipe their personal data. We:
 *        a. Delete from auth.users (Supabase Auth admin API)
 *        b. The cascade rules in public.users → favorites / ratings /
 *           collections do the rest (ON DELETE CASCADE)
 *        c. Authored prompts stay published but become anonymous
 *           (author_id ON DELETE SET NULL — already in the schema)
 *        d. Submissions stay for audit, but user_id is nulled
 *           (ON DELETE SET NULL — already in the schema)
 *
 * Pre-conditions
 * ──────────────
 * Caller MUST have already authenticated the user. These functions are
 * intentionally agnostic of auth — they take a `userId` and trust it.
 */

export interface UserDataExport {
  exportedAt: string;
  schemaVersion: 1;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    plan: string;
    createdAt: string;
  };
  submissions: Array<{
    id: string;
    status: string;
    rejectionReason: string | null;
    promptData: unknown;
    createdAt: string;
    reviewedAt: string | null;
  }>;
  authoredPrompts: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    copyCount: number;
    viewCount: number;
    createdAt: string;
  }>;
  favorites: Array<{
    promptId: string;
    promptSlug: string;
    promptTitle: string;
    createdAt: string;
  }>;
  ratings: Array<{
    promptId: string;
    promptSlug: string;
    promptTitle: string;
    rating: number;
    createdAt: string;
  }>;
}

/**
 * Gather every row this user touches and return a single JSON document.
 *
 * Performance: 4 small queries in parallel. All are indexed on user_id,
 * so even a power user with thousands of favorites resolves in <100ms.
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [userRow, submissionRows, promptRows, favoriteRows, ratingRows] =
    await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          plan: users.plan,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({
          id: submissions.id,
          status: submissions.status,
          rejectionReason: submissions.rejectionReason,
          promptData: submissions.promptData,
          createdAt: submissions.createdAt,
          reviewedAt: submissions.reviewedAt,
        })
        .from(submissions)
        .where(eq(submissions.userId, userId))
        .orderBy(desc(submissions.createdAt)),
      db
        .select({
          id: prompts.id,
          slug: prompts.slug,
          title: prompts.title,
          status: prompts.status,
          copyCount: prompts.copyCount,
          viewCount: prompts.viewCount,
          createdAt: prompts.createdAt,
        })
        .from(prompts)
        .where(eq(prompts.authorId, userId))
        .orderBy(desc(prompts.createdAt)),
      db
        .select({
          promptId: favorites.promptId,
          promptSlug: prompts.slug,
          promptTitle: prompts.title,
          createdAt: favorites.createdAt,
        })
        .from(favorites)
        .innerJoin(prompts, eq(prompts.id, favorites.promptId))
        .where(eq(favorites.userId, userId))
        .orderBy(desc(favorites.createdAt)),
      db
        .select({
          promptId: promptRatings.promptId,
          promptSlug: prompts.slug,
          promptTitle: prompts.title,
          rating: promptRatings.rating,
          createdAt: promptRatings.createdAt,
        })
        .from(promptRatings)
        .innerJoin(prompts, eq(prompts.id, promptRatings.promptId))
        .where(eq(promptRatings.userId, userId))
        .orderBy(desc(promptRatings.createdAt)),
    ]);

  const user = userRow[0];
  if (!user) {
    throw new Error("User not found");
  }

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      createdAt: user.createdAt.toISOString(),
    },
    submissions: submissionRows.map((s) => ({
      id: s.id,
      status: s.status,
      rejectionReason: s.rejectionReason,
      promptData: s.promptData,
      createdAt: s.createdAt.toISOString(),
      reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
    })),
    authoredPrompts: promptRows.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    favorites: favoriteRows.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
    })),
    ratings: ratingRows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export class AccountDeletionError extends Error {
  constructor(
    public code: "admin_cannot_delete_self" | "auth_delete_failed" | "unknown",
    message: string,
  ) {
    super(message);
    this.name = "AccountDeletionError";
  }
}

/**
 * Permanently delete the user account.
 *
 * Order of operations
 * ───────────────────
 *   1. Refuse if the user is an admin (avoids accidental lockout — admins
 *      should be demoted manually with `make-admin --revoke` first).
 *   2. Delete auth.users via Supabase Admin API. Supabase's own
 *      `on auth.user delete` cascades into public.users (via the trigger
 *      installed in `scripts/setup-auth-trigger.ts`), which then cascades
 *      via ON DELETE CASCADE into favorites + ratings + collections.
 *   3. Drizzle FKs handle the rest:
 *        prompts.author_id   → SET NULL  (content survives anonymously)
 *        submissions.user_id → SET NULL  (audit log survives)
 *
 * No transaction wraps this because Supabase Auth lives in a separate
 * service; instead we trust the cascade. Worst case (auth deleted but
 * cascade fails) leaves orphan rows that the next backfill cron sweeps.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, plan: users.plan, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    // Already gone — idempotent success.
    return;
  }

  if (user.plan === "admin") {
    throw new AccountDeletionError(
      "admin_cannot_delete_self",
      "Admins cannot self-delete. Ask another admin to demote you first.",
    );
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[deleteUserAccount] supabase deleteUser failed", {
      userId,
      message: error.message,
    });
    throw new AccountDeletionError(
      "auth_delete_failed",
      "Could not delete the account. Please try again or contact support.",
    );
  }

  // Belt-and-suspenders: if the cascade trigger isn't installed, manually
  // remove the public.users row. Idempotent — no error if it's already gone.
  await db.delete(users).where(eq(users.id, userId));
}
