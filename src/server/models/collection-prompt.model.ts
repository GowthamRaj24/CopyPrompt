import { index, integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { collections } from "./collection.model";
import { prompts } from "./prompt.model";

/**
 * Junction linking collections to prompts. Position lets us order them.
 */
export const collectionPrompts = pgTable(
  "collection_prompts",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.promptId] }),
    index("idx_collection_prompts_prompt").on(t.promptId),
  ],
);

export type CollectionPrompt = typeof collectionPrompts.$inferSelect;
export type NewCollectionPrompt = typeof collectionPrompts.$inferInsert;
