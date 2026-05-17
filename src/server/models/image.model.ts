import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { prompts } from "./prompt.model";

/**
 * Images attached to prompts. 1-3 images per prompt typically.
 * The actual file lives in Cloudflare R2; we just store keys + metadata.
 */
export const images = pgTable(
  "images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull().unique(),
    cdnUrl: text("cdn_url").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_images_prompt_id").on(t.promptId, t.position)],
);

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
