/**
 * One-time setup: install the auth.users -> public.users sync trigger.
 *
 * When a user signs up via Supabase Auth, a row is created in `auth.users`.
 * This trigger automatically creates a matching row in `public.users` so we
 * can join with our app data.
 *
 * Run with:  npx tsx scripts/setup-auth-trigger.ts
 *
 * Idempotent - safe to re-run.
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

async function main() {
  console.log("Installing handle_new_user function...");

  // The function: copy auth.users fields into public.users
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.users (id, email, full_name, avatar_url)
      VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$;
  `);

  console.log("Installing on_auth_user_created trigger...");

  // Drop existing trigger if any (so re-runs don't fail)
  await sql.unsafe(`
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  `);

  // Re-create
  await sql.unsafe(`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  `);

  // Backfill: any existing auth.users without a public.users row gets one now
  console.log("Backfilling existing users...");

  const result = await sql.unsafe(`
    INSERT INTO public.users (id, email, full_name, avatar_url)
    SELECT
      au.id,
      au.email,
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'avatar_url'
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.id = au.id
    WHERE pu.id IS NULL
    RETURNING id;
  `);

  console.log(`✓ Trigger installed`);
  console.log(`✓ Backfilled ${result.length} existing users`);
  console.log("");
  console.log(
    "From now on, any new sign-up will auto-create a public.users row.",
  );

  await sql.end();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
