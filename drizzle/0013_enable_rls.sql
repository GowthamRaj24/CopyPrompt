-- Lock down the Supabase Data API (PostgREST).
--
-- The browser ships NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, which maps to the
-- `anon` role (and `authenticated` once signed in). Without RLS, those roles
-- could SELECT/INSERT/UPDATE/DELETE every table in `public` directly via
-- https://<ref>.supabase.co/rest/v1/* — including users.plan (admin takeover).
--
-- The app never queries tables from the browser: all data access goes through
-- Drizzle (role `postgres`, table owner, BYPASSRLS) or the server-side
-- supabaseAdmin client (secret key, service_role, BYPASSRLS). So we enable RLS
-- with NO policies (deny-all for anon/authenticated) and revoke their grants.
--
-- Idempotent: safe to re-run. Covers tables created later via the default-
-- privileges change + the loop (re-run this file after adding tables).

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Future tables created by `postgres` don't get auto-granted to API roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
