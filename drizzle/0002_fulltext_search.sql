-- ════════════════════════════════════════════════════════════════════════
-- Full-text search: generated tsvector column + GIN index
-- ════════════════════════════════════════════════════════════════════════
-- Why this exists
-- ───────────────
-- The previous implementation built the tsvector inline on every search:
--   to_tsvector(title) || to_tsvector(prompt_text) || to_tsvector(tips)
-- Two problems at scale:
--   1. Postgres cannot use an index when the vector is computed on the fly.
--      Every query falls back to a full table scan + on-the-fly tsvector
--      construction. Fine for 100 rows, painful at 10,000+, fatal at 100k.
--   2. CPU repeats the same lexing/stemming work for every query.
--
-- The fix is a STORED generated column (the database materializes it once
-- per row) plus a GIN index on it. Searches then become an index lookup
-- with ts_rank applied only to the matched rows.
--
-- Safety
-- ──────
-- Every statement uses IF NOT EXISTS or DROP+RECREATE patterns so this
-- migration is idempotent — run it as many times as you like.
-- ════════════════════════════════════════════════════════════════════════

-- 1) Add the generated tsvector column.
--    The weights mirror the original code: title (A) > prompt_text (B) > tips (C).
--    Postgres will populate this column for every existing row on first run
--    and keep it in sync on every UPDATE going forward (zero application code).
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS search_doc tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(prompt_text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(tips, '')), 'C')
  ) STORED;

-- 2) GIN index — the single most important line in this file.
--    Without it, FTS still works but every query is a sequential scan.
CREATE INDEX IF NOT EXISTS idx_prompts_search_doc
  ON prompts USING GIN (search_doc);

-- 3) Trigram extension for typo-tolerant "did you mean" suggestions later.
--    Cheap to enable, harmless if unused. Skip line 53 if you don't have
--    superuser rights on your Postgres (managed Supabase does, by default).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4) Index on the title for trigram/ILIKE fallback when users type a
--    partial word that doesn't tokenize cleanly ("port" → "portrait").
CREATE INDEX IF NOT EXISTS idx_prompts_title_trgm
  ON prompts USING GIN (title gin_trgm_ops);

-- ════════════════════════════════════════════════════════════════════════
-- Engagement sort indexes — for the homepage's "Most viewed" / "Top rated"
-- ════════════════════════════════════════════════════════════════════════
-- The previous trending section only sorted by copy_count and had its
-- own index. Adding sorted indexes on view_count and (upvotes - downvotes)
-- keeps those new homepage queries at O(log n) instead of O(n log n)
-- once the catalog grows past a few thousand rows.
--
-- Partial indexes: only published rows are ever shown on the homepage,
-- so we exclude drafts / hidden / archived to shrink each index by 2-3×
-- and dodge any "drafts ranking with views=0" weirdness on small datasets.

-- 5) Most-viewed sort
CREATE INDEX IF NOT EXISTS idx_prompts_view_count_published
  ON prompts (view_count DESC)
  WHERE status = 'published';

-- 6) Top-rated sort — index the computed expression so ORDER BY uses it.
CREATE INDEX IF NOT EXISTS idx_prompts_net_votes_published
  ON prompts ((upvotes - downvotes) DESC)
  WHERE status = 'published';

-- 7) Recency sort — the existing idx_prompts_status_created already
--    covers (status, created_at). No new index needed.
