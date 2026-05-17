import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./user.model";

/**
 * Curated lists of prompts.
 * Two flavors:
 *   - is_curated: true   = admin-built collections shown on the site
 *   - is_curated: false  = user-built collections (Premium feature)
 */
export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: uuid("owner_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  coverImageUrl: text("cover_image_url"),
  isPublic: boolean("is_public").notNull().default(true),
  isCurated: boolean("is_curated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
