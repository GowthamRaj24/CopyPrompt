import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.model";

/**
 * User-defined search alerts.
 *
 * The digest cron `/api/cron/saved-search-digest` walks this table daily
 * and emails users the new prompts matching their filters since
 * `last_seen_at`.
 */
export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    query: text("query"),
    type: text("type"),
    sort: text("sort"),
    categorySlug: text("category_slug"),
    modelSlug: text("model_slug"),
    tagSlugs: text("tag_slugs").array(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_saved_searches_user").on(t.userId, t.createdAt)],
);

export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
