import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * AI models supported on mycopyprompt.
 * Examples: flux-dev, flux-schnell, flux-pro, midjourney, sdxl, dall-e-3, chatgpt, claude
 */
export const models = pgTable("models", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  type: text("type", { enum: ["image", "text"] }).notNull(),
  iconUrl: text("icon_url"),
  promptCount: integer("prompt_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
