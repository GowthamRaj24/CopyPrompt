-- Step 10: Contributor leaderboard + badges.
-- Denormalized stats on `users` so the /contributors page can ORDER BY
-- copies-received without an aggregate over the entire `prompts` table.
--
-- Backfill runs as part of this migration; the daily cron keeps both
-- columns in sync going forward. The approve flow also bumps
-- `total_prompts_published` immediately so newly-approved authors don't
-- have to wait 24h for their first badge to appear.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "total_copies_received" integer NOT NULL DEFAULT 0;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "total_prompts_published" integer NOT NULL DEFAULT 0;

-- Backfill from prompts in one pass.
UPDATE "users" u
SET
  "total_copies_received" = COALESCE(agg.copies, 0)::int,
  "total_prompts_published" = COALESCE(agg.prompts, 0)::int
FROM (
  SELECT
    p.author_id,
    SUM(p.copy_count) AS copies,
    COUNT(*) AS prompts
  FROM prompts p
  WHERE p.author_id IS NOT NULL
    AND p.status = 'published'
    AND p.visibility = 'public'
  GROUP BY p.author_id
) agg
WHERE u.id = agg.author_id;

-- Partial index makes leaderboard queries cheap regardless of catalog size.
CREATE INDEX IF NOT EXISTS "idx_users_leaderboard"
  ON "users" ("total_copies_received" DESC, "total_prompts_published" DESC)
  WHERE "total_prompts_published" > 0;
