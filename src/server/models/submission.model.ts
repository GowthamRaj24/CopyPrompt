import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./user.model";

/**
 * Holds pending submissions before admin approval.
 * Decoupling from `prompts` keeps unreviewed content out of the public index.
 *
 * `prompt_data` jsonb shape:
 * {
 *   title, prompt_text, negative_prompt, tips,
 *   model_slug, category_slug, tag_slugs,
 *   params, image_keys (R2 keys uploaded but not yet copied to prompts/)
 * }
 */
export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    email: text("email"), // for anonymous submissions
    promptData: jsonb("prompt_data").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    rejectionReason: text("rejection_reason"),
    reviewerId: uuid("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_submissions_status_created").on(t.status, t.createdAt),
    index("idx_submissions_user").on(t.userId),
  ],
);

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
