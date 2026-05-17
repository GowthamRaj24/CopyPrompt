-- Performance indexes for pagination, analytics, and trending queries.
--
-- Supabase SQL editor: run this file as-is (no CONCURRENTLY — it cannot run
-- inside a transaction).
--
-- Large production DB via psql (optional, one index at a time, outside a txn):
--   Replace CREATE INDEX with CREATE INDEX CONCURRENTLY for zero-downtime builds.

-- Trending / browse: published prompts by copy_count
CREATE INDEX IF NOT EXISTS idx_prompts_published_copy_count
  ON prompts (copy_count DESC)
  WHERE status = 'published';

-- Category parent nav (homepage)
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON categories (parent_id)
  WHERE parent_id IS NULL;

-- Analytics time-series
CREATE INDEX IF NOT EXISTS idx_users_created_at
  ON users (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_created_at
  ON favorites (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_ratings_created_at
  ON prompt_ratings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_at
  ON submissions (reviewed_at DESC)
  WHERE status = 'approved';

-- Submit form tag autocomplete
CREATE INDEX IF NOT EXISTS idx_tags_usage_count
  ON tags (usage_count DESC);

-- Account export
CREATE INDEX IF NOT EXISTS idx_prompts_author_id
  ON prompts (author_id)
  WHERE author_id IS NOT NULL;
