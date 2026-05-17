-- Private prompts: unlisted share links (visibility + share_token)
ALTER TABLE "prompts"
  ADD COLUMN IF NOT EXISTS "visibility" text NOT NULL DEFAULT 'public';

ALTER TABLE "prompts"
  ADD COLUMN IF NOT EXISTS "share_token" text;

UPDATE "prompts" SET "visibility" = 'public' WHERE "visibility" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prompts_visibility_check'
  ) THEN
    ALTER TABLE "prompts"
      ADD CONSTRAINT "prompts_visibility_check"
      CHECK ("visibility" IN ('public', 'private'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "prompts_share_token_unique"
  ON "prompts" ("share_token")
  WHERE "share_token" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_prompts_visibility_status"
  ON "prompts" ("visibility", "status");
