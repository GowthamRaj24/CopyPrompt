import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { prompts } from "./prompt.model";
import { tags } from "./tag.model";

/**
 * Junction table linking prompts to tags (many-to-many).
 */
export const promptTags = pgTable(
  "prompt_tags",
  {
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.promptId, t.tagId] }),
    index("idx_prompt_tags_tag").on(t.tagId),
  ],
);

export type PromptTag = typeof promptTags.$inferSelect;
export type NewPromptTag = typeof promptTags.$inferInsert;
