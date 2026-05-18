-- Step 4: Welcome email — mark when each user has been welcomed once.
-- `welcomed_at` lets us atomically claim the welcome event so concurrent
-- requests cannot double-send the email (see welcome.service.ts).

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "welcomed_at" timestamp with time zone;
