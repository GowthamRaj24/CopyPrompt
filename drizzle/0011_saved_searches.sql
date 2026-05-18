-- Step 8: Saved searches + alerts.
--
-- Each row captures one user-defined query + filters; the daily digest
-- cron looks for newly-published prompts that match and emails the user.

CREATE TABLE IF NOT EXISTS "saved_searches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "label" text NOT NULL,
  -- Filters captured from the /search URL params.
  "query" text,
  "type" text,
  "sort" text,
  -- Future-proofing: not populated by the current /search UI but ready
  -- for Step 9 (curated landing pages) without another migration.
  "category_slug" text,
  "model_slug" text,
  "tag_slugs" text[],
  -- Watermark advanced by the digest cron on each successful send.
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saved_searches_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "saved_searches"
      ADD CONSTRAINT "saved_searches_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_saved_searches_user"
  ON "saved_searches" ("user_id", "created_at" DESC);
