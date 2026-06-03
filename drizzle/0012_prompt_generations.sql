-- 0012_prompt_generations.sql
-- Records every AI prompt-generation request submitted via /generate.
-- Powers per-day + per-minute rate limiting AND gives admins a usage
-- audit trail for abuse detection.
--
-- Retention is managed by the daily cron (TTL 30 days for success rows,
-- 90 days for error rows so abuse patterns stay analyzable).

CREATE TABLE IF NOT EXISTS "prompt_generations" (
    "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"        uuid NOT NULL,
    "description"    text NOT NULL,
    "result"         jsonb,
    "status"         text NOT NULL DEFAULT 'success',
    "error"          text,
    "model"          text NOT NULL,
    "duration_ms"    integer,
    "ip_hash"        text,
    "created_at"     timestamp with time zone NOT NULL DEFAULT now()
);

-- Foreign key — defensive guard so a missing constraint name doesn't
-- block re-runs of this migration.
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'prompt_generations_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "prompt_generations"
            ADD CONSTRAINT "prompt_generations_user_id_users_id_fk"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id")
            ON DELETE CASCADE;
    END IF;
END $$;

-- Hot path: count today's rows for a user (per-day quota check).
CREATE INDEX IF NOT EXISTS "idx_prompt_generations_user_created"
    ON "prompt_generations" ("user_id", "created_at" DESC);

-- Cron path: prune rows older than the retention window.
CREATE INDEX IF NOT EXISTS "idx_prompt_generations_created"
    ON "prompt_generations" ("created_at");
