/**
 * Reset engagement counters on every prompt to 0.
 *
 * Why this exists
 * ───────────────
 * Earlier versions of `seed-prompts.ts` / `seed-text-prompts.ts`
 * hard-coded inflated `copy_count` + `upvotes` values to make the
 * UI look populated. The current seed scripts no longer do that, but
 * any DB seeded before the change is still carrying those fake
 * numbers. Run this once to wipe them. Real counters will accumulate
 * from real interactions going forward.
 *
 * Usage:
 *   npm run db:reset-counters            # zero every counter
 *   npm run db:reset-counters --confirm  # same; the flag is decorative
 *
 * Safe to re-run any time. Affects ONLY:
 *   prompts.copy_count
 *   prompts.view_count
 *   prompts.upvotes
 *   prompts.downvotes
 *
 * Does NOT touch tag usage_count, model prompt_count, submissions,
 * favorites, ratings — those reflect real user actions, not seed data.
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
});

async function main() {
  console.log("→ Resetting engagement counters on prompts…");

  const before = await sql<
    Array<{
      total_copies: string;
      total_views: string;
      total_up: string;
      total_down: string;
      rows: string;
    }>
  >`
    SELECT
      COALESCE(SUM(copy_count), 0)::text  AS total_copies,
      COALESCE(SUM(view_count), 0)::text  AS total_views,
      COALESCE(SUM(upvotes), 0)::text     AS total_up,
      COALESCE(SUM(downvotes), 0)::text   AS total_down,
      COUNT(*)::text                      AS rows
    FROM prompts
  `;
  const b = before[0];
  if (b) {
    console.log(
      `  before: ${b.rows} prompts | copies ${b.total_copies} · views ${b.total_views} · up ${b.total_up} · down ${b.total_down}`,
    );
  }

  const result = await sql`
    UPDATE prompts
    SET
      copy_count = 0,
      view_count = 0,
      upvotes    = 0,
      downvotes  = 0,
      updated_at = NOW()
    WHERE copy_count > 0
       OR view_count > 0
       OR upvotes    > 0
       OR downvotes  > 0
    RETURNING id
  `;
  console.log(`  ✓ Zeroed counters on ${result.length} prompt row(s).`);

  console.log("\n✓ Counters reset. Refresh /admin/analytics to confirm.");
}

main()
  .catch((err) => {
    console.error("\n✗ Reset failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
