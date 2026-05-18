-- Step 2: Collections — additive indexes for fast user lookups.
-- Tables `collections` and `collection_prompts` already exist (migration 0000);
-- this migration only adds indexes needed by the new service layer.

CREATE INDEX IF NOT EXISTS "idx_collections_owner_updated"
  ON "collections" ("owner_id", "updated_at" DESC)
  WHERE "owner_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_collections_curated_public"
  ON "collections" ("is_curated", "is_public", "updated_at" DESC)
  WHERE "is_public" = true;

CREATE INDEX IF NOT EXISTS "idx_collection_prompts_collection_position"
  ON "collection_prompts" ("collection_id", "position");
