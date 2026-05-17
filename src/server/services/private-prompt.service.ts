import { and, count, desc, eq, gte } from "drizzle-orm";
import { PROMPT_VISIBILITY } from "@/lib/prompt-visibility";
import { buildShareUrl, generateShareToken } from "@/lib/share-token";
import { RATE_LIMITS } from "@/server/config/constants";
import { db } from "@/server/lib/db";
import { prompts } from "@/server/models/prompt.model";
import type { SubmissionInput } from "@/server/validators/submission.validator";
import { createPromptFromSubmission } from "./prompt-create.service";

export interface OwnedPromptRow {
  id: string;
  slug: string;
  title: string;
  visibility: "public" | "private";
  shareToken: string | null;
  status: string;
  copyCount: number;
  createdAt: Date;
}

export async function countPrivatePromptsToday(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [row] = await db
    .select({ c: count() })
    .from(prompts)
    .where(
      and(
        eq(prompts.authorId, userId),
        eq(prompts.visibility, PROMPT_VISIBILITY.PRIVATE),
        gte(prompts.createdAt, startOfDay),
      ),
    );

  return row?.c ?? 0;
}

export async function createPrivatePrompt(
  input: SubmissionInput,
  authorId: string,
): Promise<{ id: string; slug: string; shareUrl: string; title: string }> {
  const todayCount = await countPrivatePromptsToday(authorId);
  if (todayCount >= RATE_LIMITS.PRIVATE_PROMPT_PER_DAY) {
    throw new Error(
      `You can create up to ${RATE_LIMITS.PRIVATE_PROMPT_PER_DAY} private prompts per day.`,
    );
  }

  const { id, slug, shareToken } = await createPromptFromSubmission(input, {
    authorId,
    visibility: PROMPT_VISIBILITY.PRIVATE,
  });

  if (!shareToken) {
    throw new Error("Failed to generate share link");
  }

  return {
    id,
    slug,
    shareUrl: buildShareUrl(shareToken),
    title: input.title,
  };
}

export async function listOwnedPrompts(
  userId: string,
): Promise<OwnedPromptRow[]> {
  const rows = await db
    .select({
      id: prompts.id,
      slug: prompts.slug,
      title: prompts.title,
      visibility: prompts.visibility,
      shareToken: prompts.shareToken,
      status: prompts.status,
      copyCount: prompts.copyCount,
      createdAt: prompts.createdAt,
    })
    .from(prompts)
    .where(eq(prompts.authorId, userId))
    .orderBy(desc(prompts.createdAt))
    .limit(100);

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    visibility: r.visibility as "public" | "private",
    shareToken: r.shareToken,
    status: r.status,
    copyCount: r.copyCount,
    createdAt: r.createdAt,
  }));
}

export async function regenerateShareToken(
  promptId: string,
  userId: string,
): Promise<{ shareUrl: string }> {
  const newToken = generateShareToken();
  const [updated] = await db
    .update(prompts)
    .set({ shareToken: newToken, updatedAt: new Date() })
    .where(
      and(
        eq(prompts.id, promptId),
        eq(prompts.authorId, userId),
        eq(prompts.visibility, PROMPT_VISIBILITY.PRIVATE),
        eq(prompts.status, "published"),
      ),
    )
    .returning({ shareToken: prompts.shareToken });

  if (!updated?.shareToken) {
    throw new Error("Prompt not found or not private");
  }

  return { shareUrl: buildShareUrl(updated.shareToken) };
}

export async function publishPrivateToCatalog(
  promptId: string,
  userId: string,
): Promise<{ slug: string }> {
  const [row] = await db
    .select({ slug: prompts.slug })
    .from(prompts)
    .where(
      and(
        eq(prompts.id, promptId),
        eq(prompts.authorId, userId),
        eq(prompts.visibility, PROMPT_VISIBILITY.PRIVATE),
        eq(prompts.status, "published"),
      ),
    )
    .limit(1);

  if (!row) throw new Error("Prompt not found or not private");

  await db
    .update(prompts)
    .set({
      visibility: PROMPT_VISIBILITY.PUBLIC,
      shareToken: null,
      updatedAt: new Date(),
    })
    .where(eq(prompts.id, promptId));

  const { refreshPromptEmbedding } = await import("./embedding.service");
  void refreshPromptEmbedding(promptId).catch((err) => {
    console.error("[embedding] publish private:", err);
  });

  return { slug: row.slug };
}

export async function hideOwnedPrompt(
  promptId: string,
  userId: string,
): Promise<void> {
  const [updated] = await db
    .update(prompts)
    .set({
      status: "hidden",
      shareToken: null,
      updatedAt: new Date(),
    })
    .where(and(eq(prompts.id, promptId), eq(prompts.authorId, userId)))
    .returning({ id: prompts.id });

  if (!updated) {
    throw new Error("Prompt not found");
  }
}
