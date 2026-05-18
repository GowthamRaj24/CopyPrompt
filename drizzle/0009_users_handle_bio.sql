-- Step 7: Creator profiles.
-- Add a public `handle` (URL-safe identity) + free-form `bio`.
--
-- Backfill strategy
-- ─────────────────
-- 1. Sanitise the email-prefix into the longest URL-safe component.
-- 2. Append the first 8 hex characters of the user's UUID — guaranteed
--    near-unique per user (4 billion entropy), so the unique index never
--    explodes on import.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "handle" text;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bio" text;

UPDATE "users"
SET "handle" = COALESCE(
  NULLIF(
    substring(
      lower(regexp_replace(split_part("email", '@', 1), '[^a-z0-9]+', '', 'gi')),
      1, 24
    ),
    ''
  ),
  'user'
) || '-' || substring(replace("id"::text, '-', ''), 1, 8)
WHERE "handle" IS NULL;

-- Enforce uniqueness + non-null going forward.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_handle_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_handle_unique" UNIQUE ("handle");
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "handle" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_users_handle_lower"
  ON "users" (lower("handle"));
