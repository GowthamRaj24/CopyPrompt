/**
 * Idempotent Supabase Storage setup.
 *
 * Creates (or updates) the bucket used for prompt-image uploads with sane
 * defaults for our use case:
 *
 *   - Public read     : prompt images render via <img src> without signed URLs
 *   - 5 MB upload cap : enough for hi-res samples, blocks malicious uploads
 *   - JPEG/PNG/WebP/GIF allowed mime types
 *
 * Why Supabase Storage (over Cloudflare R2 / Cloudinary / ImgBB)
 * ─────────────────────────────────────────────────────────────
 *   1. FREE — 1 GB storage + 2 GB egress per month on the same free tier
 *      that hosts your database. No second vendor relationship.
 *   2. RLS-aware — uploads can be gated by the same Supabase auth session.
 *   3. CDN-fronted (Cloudflare) — globally cached, free.
 *   4. S3-compatible — easy migration path if you outgrow the free tier.
 *
 * Run once after deploy:
 *   npm run db:setup-storage
 *
 * Re-running is safe — the script detects an existing bucket and patches
 * its config rather than failing.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Match drizzle.config.ts — load `.env.local` first (project convention)
// then fall back to `.env`. tsx doesn't auto-load either, so we do it here.
config({ path: ".env.local" });
config();

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SECRET_KEY
) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env. Aborting.",
  );
  process.exit(1);
}

// Captured after the env guard so the types are narrowed to `string`.
const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY: string = process.env.SUPABASE_SECRET_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "prompt-images";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`→ Ensuring bucket "${BUCKET}" exists…`);

  const { data: existing, error: listErr } =
    await supabase.storage.listBuckets();
  if (listErr) {
    throw new Error(`Could not list buckets: ${listErr.message}`);
  }

  const found = existing?.find((b) => b.name === BUCKET);

  if (!found) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_MIME,
    });
    if (createErr) {
      throw new Error(`Could not create bucket: ${createErr.message}`);
    }
    console.log(`  ✓ Bucket created (public, 5 MB max, jpeg/png/webp/gif).`);
  } else {
    const { error: updateErr } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_MIME,
    });
    if (updateErr) {
      throw new Error(`Could not update bucket config: ${updateErr.message}`);
    }
    console.log(`  ✓ Bucket already exists — config refreshed.`);
  }

  console.log("\n✓ Supabase Storage is ready.");
  console.log(`  Bucket name: ${BUCKET}`);
  console.log(`  Public URL pattern: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/<path>`);
  console.log("\nNext step:");
  console.log("  Add the host to next.config.ts → images.remotePatterns:");
  const hostname = new URL(SUPABASE_URL).hostname;
  console.log(`    { protocol: "https", hostname: "${hostname}" }`);
}

main().catch((err) => {
  console.error("\n✗ Setup failed:", err);
  process.exit(1);
});
