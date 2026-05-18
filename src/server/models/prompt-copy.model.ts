import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { prompts } from "./prompt.model";
import { users } from "./user.model";

/**
 * Per-user copy events.
 *
 * One row per copy click made by a logged-in user. Drives:
 *   - "Recently copied" rail on homepage (signed-in only)
 *   - "Recently copied" section on /account
 *   - Future: "Trending for you" recommendations
 *
 * Anonymous copies are NOT stored here — they only bump
 * `prompts.copy_count` via the counter batcher.
 *
 * Rows are pruned at 30 days by the `/api/cron/prune-copies` cron
 * (see plan Step 1.2).
 */
export const promptCopies = pgTable(
  "prompt_copies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_prompt_copies_user_created").on(t.userId, t.createdAt),
    index("idx_prompt_copies_created").on(t.createdAt),
    index("idx_prompt_copies_prompt").on(t.promptId),
  ],
);

export type PromptCopy = typeof promptCopies.$inferSelect;
export type NewPromptCopy = typeof promptCopies.$inferInsert;
