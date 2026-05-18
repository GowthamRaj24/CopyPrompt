-- Step 3: Remix flow.
-- Track which existing prompt (if any) a new prompt was remixed from.
-- ON DELETE SET NULL so removing a source prompt does not break its remixes.

ALTER TABLE "prompts"
  ADD COLUMN IF NOT EXISTS "remix_source_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prompts_remix_source_id_prompts_id_fk'
  ) THEN
    ALTER TABLE "prompts"
      ADD CONSTRAINT "prompts_remix_source_id_prompts_id_fk"
      FOREIGN KEY ("remix_source_id") REFERENCES "public"."prompts"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_prompts_remix_source"
  ON "prompts" ("remix_source_id")
  WHERE "remix_source_id" IS NOT NULL;
