import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Free-form tags attached to prompts.
 * Examples: cinematic, neon, cyberpunk, golden-hour
 */
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
