/**
 * Promote a user to admin (or revoke admin status).
 *
 * Sets `public.users.plan = 'admin'` for the given email, which is the
 * column `requireAdmin()` checks in src/server/lib/auth.ts.
 *
 * Usage:
 *   npx tsx scripts/make-admin.ts <email>           # promote
 *   npx tsx scripts/make-admin.ts <email> --revoke  # demote back to free
 *
 * Examples:
 *   npx tsx scripts/make-admin.ts me@example.com
 *   npx tsx scripts/make-admin.ts me@example.com --revoke
 *
 * Idempotent — safe to re-run. Prints the user's row before and after.
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"));
const revoke = args.includes("--revoke");

if (!email) {
  console.error("Usage: tsx scripts/make-admin.ts <email> [--revoke]");
  console.error("");
  console.error("Examples:");
  console.error("  tsx scripts/make-admin.ts me@example.com");
  console.error("  tsx scripts/make-admin.ts me@example.com --revoke");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const targetPlan = revoke ? "free" : "admin";

async function main() {
  const normalisedEmail = email!.trim().toLowerCase();

  // Look up the user
  const [before] = await sql<
    { id: string; email: string; full_name: string | null; plan: string }[]
  >`
    SELECT id, email, full_name, plan
    FROM public.users
    WHERE LOWER(email) = ${normalisedEmail}
    LIMIT 1
  `;

  if (!before) {
    console.error(`\n  ✗ No user found with email: ${email}`);
    console.error(
      `\n  Tip: the user must have signed in at least once so the\n` +
        `       auth trigger can create their public.users row.\n`,
    );
    await sql.end();
    process.exit(1);
  }

  console.log("\n  User found:");
  console.log(`    id      ${before.id}`);
  console.log(`    email   ${before.email}`);
  console.log(`    name    ${before.full_name ?? "(none)"}`);
  console.log(`    plan    ${before.plan}`);

  if (before.plan === targetPlan) {
    console.log(`\n  ✓ Already ${targetPlan}. Nothing to do.\n`);
    await sql.end();
    return;
  }

  await sql`
    UPDATE public.users
    SET plan = ${targetPlan}, updated_at = NOW()
    WHERE id = ${before.id}
  `;

  console.log(`\n  ✓ ${before.plan}  →  ${targetPlan}`);
  console.log(
    `\n  ${
      targetPlan === "admin"
        ? "They can now access /admin after they refresh."
        : "Admin access revoked."
    }\n`,
  );

  await sql.end();
}

main().catch(async (err) => {
  console.error("\n  ✗ Failed:", err.message ?? err);
  await sql.end();
  process.exit(1);
});
