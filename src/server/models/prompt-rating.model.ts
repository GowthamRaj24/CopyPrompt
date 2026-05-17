import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { prompts } from "./prompt.model";
import { users } from "./user.model";

/**
 * Thumbs up/down on prompts.
 * For logged-in users, dedupe by (user_id, prompt_id).
 * For anonymous, dedupe by (session_id, prompt_id).
 *
 * rating: -1 (down) or +1 (up)
 */
export const promptRatings = pgTable(
  "prompt_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    sessionId: text("session_id"),
    rating: smallint("rating").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_rating_user_prompt")
      .on(t.userId, t.promptId)
      .where(sql`user_id IS NOT NULL`),
    uniqueIndex("uq_rating_session_prompt")
      .on(t.sessionId, t.promptId)
      .where(sql`user_id IS NULL`),
    index("idx_prompt_ratings_prompt").on(t.promptId),
  ],
);

export type PromptRating = typeof promptRatings.$inferSelect;
export type NewPromptRating = typeof promptRatings.$inferInsert;
