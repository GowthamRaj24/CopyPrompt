-- Step 1: Copy history.
-- Records every logged-in copy event so we can render "Recently copied"
-- on the homepage / account. Aggregate counts still live on prompts.copy_count
-- via the counter batcher — this table is for the per-user timeline only.
-- Anonymous copies are NOT recorded (counter-batcher still increments).

CREATE TABLE IF NOT EXISTS "prompt_copies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "prompt_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prompt_copies_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "prompt_copies"
      ADD CONSTRAINT "prompt_copies_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prompt_copies_prompt_id_prompts_id_fk'
  ) THEN
    ALTER TABLE "prompt_copies"
      ADD CONSTRAINT "prompt_copies_prompt_id_prompts_id_fk"
      FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- Per-user timeline lookup (used by the "Recently copied" rail/page).
CREATE INDEX IF NOT EXISTS "idx_prompt_copies_user_created"
  ON "prompt_copies" ("user_id", "created_at" DESC);

-- Used by the 30-day prune cron.
CREATE INDEX IF NOT EXISTS "idx_prompt_copies_created"
  ON "prompt_copies" ("created_at");

-- Per-prompt aggregations (future "Trending for you" — kept cheap).
CREATE INDEX IF NOT EXISTS "idx_prompt_copies_prompt"
  ON "prompt_copies" ("prompt_id");
