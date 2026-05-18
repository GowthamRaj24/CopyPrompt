import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Read-only tsvector handle. Drizzle ships no first-class tsvector type
 * because the column is GENERATED ALWAYS — the app never writes to it.
 * We expose it as a typed reference so query builders can include it in
 * WHERE/ORDER BY without raw SQL string concatenation.
 */
const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});
import { categories } from "./category.model";
import { models } from "./model.model";
import { users } from "./user.model";

/**
 * Core table - every searchable prompt lives here.
 * Supports BOTH image prompts (Flux, MJ, SD, DALL-E) and text prompts (ChatGPT, Claude, etc.).
 *
 * `params` jsonb holds model-specific knobs:
 *   - Image: { aspect_ratio: "16:9", steps: 30, guidance: 3.5, seed: 12345 }
 *   - Text:  { temperature: 0.7, max_tokens: 2000, system_message: "..." }
 *
 * `expected_outcome` is shown for text prompts (where there are no images).
 * `negative_prompt` is for image prompts (Stable Diffusion, Flux variants).
 *
 * Full-text search column (`search_doc` tsvector) is added via raw SQL
 * in a separate migration since Drizzle's tsvector support is limited.
 */
export const prompts = pgTable(
  "prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    promptText: text("prompt_text").notNull(),
    negativePrompt: text("negative_prompt"),
    expectedOutcome: text("expected_outcome"),
    modelId: uuid("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    params: jsonb("params").notNull().default(sql`'{}'::jsonb`),
    tips: text("tips"),
    /**
     * Embedding for semantic search.
     * Generated from `title + prompt_text + tips + expected_outcome` via
     * BAAI/bge-base-en-v1.5 (768 dimensions) via Together AI or Hugging Face.
     */
    embedding: vector("embedding", { dimensions: 768 }),
    /**
     * Generated tsvector column populated by Postgres on insert/update.
     * NEVER written from application code — the GENERATED ALWAYS clause
     * in `drizzle/0002_fulltext_search.sql` enforces this at the DB level.
     * Indexed by GIN (`idx_prompts_search_doc`) for O(log n) search.
     */
    searchDoc: tsvector("search_doc"),
    viewCount: integer("view_count").notNull().default(0),
    copyCount: integer("copy_count").notNull().default(0),
    upvotes: integer("upvotes").notNull().default(0),
    downvotes: integer("downvotes").notNull().default(0),
    status: text("status", { enum: ["draft", "published", "hidden"] })
      .notNull()
      .default("published"),
    visibility: text("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("public"),
    /** Unguessable token for private share URLs — null when public. */
    shareToken: text("share_token"),
    /**
     * Source prompt this one was remixed from (if any). `ON DELETE SET NULL`
     * so deleting an original does not cascade-destroy its remixes.
     */
    remixSourceId: uuid("remix_source_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_prompts_status_created").on(t.status, t.createdAt),
    index("idx_prompts_visibility_status").on(t.visibility, t.status),
    index("idx_prompts_model_status").on(t.modelId, t.status),
    index("idx_prompts_category_status").on(t.categoryId, t.status),
    index("idx_prompts_copy_count").on(t.copyCount),
    // Sorted indexes for homepage rankings — created in
    // `drizzle/0002_fulltext_search.sql` (idempotent via setup-fts).
    // Declared here so drizzle-kit's schema diff stays accurate.
    index("idx_prompts_view_count_published").on(t.viewCount),
    // The net-votes index is a partial expression index on
    // (upvotes - downvotes); drizzle-kit can't express that yet, so it
    // exists only in the SQL migration.
  ],
);

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
