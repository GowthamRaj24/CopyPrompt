import { z } from "zod";

/**
 * Validated environment variables.
 *
 * - REQUIRED vars (DATABASE_URL etc.) fail fast at boot if missing.
 * - OPTIONAL vars are forgiving: empty strings and `[PLACEHOLDER]` values
 *   are normalized to `undefined`. Format validation is deferred to the
 *   SDK that uses them.
 */

/**
 * Helper: optional string that treats empty strings and `[PLACEHOLDER]`
 * values as not-set.
 */
const optionalString = z
  .string()
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    if (v.length === 0) return undefined;
    // Treat `[YOUR_THING]` and `https://[YOUR_BUCKET].r2.dev` style
    // placeholders as not-set (so devs can leave the template alone)
    if (v.includes("[") || v.includes("YOUR_")) return undefined;
    return v;
  });

const envSchema = z.object({
  // ── REQUIRED: Database ──────────────────────────────────────
  DATABASE_URL: z.string().url(),

  // ── REQUIRED: Supabase ──────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),

  // ── OPTIONAL: Cloudflare R2 (set up in a later step) ────────
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET_NAME: optionalString,
  R2_PUBLIC_URL: optionalString,

  // ── OPTIONAL: Together AI (Flux images + BGE embeddings) ───
  TOGETHER_API_KEY: optionalString,

  // ── OPTIONAL: Google Gemini (prompt-generation feature) ────
  // Get a free key at https://aistudio.google.com/api-keys
  // When unset, the /generate page returns a friendly "not configured"
  // message so deploys without the key keep building.
  GEMINI_API_KEY: optionalString,
  // Defaults to "gemini-2.5-flash" — fast, capable, and on the free
  // tier in AI Studio. Override only if you need a different model.
  GEMINI_MODEL: optionalString,

  // ── OPTIONAL: Hugging Face (free BGE embeddings fallback) ───
  // Fine-grained token with Inference Providers — see .env.example
  HF_TOKEN: optionalString,

  // ── OPTIONAL: Jina AI (free embeddings fallback) ────────────
  // https://jina.ai/?sui=apikey — jina-embeddings-v2-base-en (768-dim)
  JINA_API_KEY: optionalString,

  // ── OPTIONAL: SMTP (Nodemailer for OTP / transactional emails) ──
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalString,
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: optionalString,
  SMTP_FROM_NAME: optionalString,

  // ── OPTIONAL: Razorpay (set up when adding premium) ─────────
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,

  // ── Misc ────────────────────────────────────────────────────
  CRON_SECRET: optionalString,
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ── OPTIONAL: DB tuning ─────────────────────────────────────
  // Max Postgres connections per server instance. Default 10 is safe for
  // Supabase free tier (60 total) and for the PgBouncer pooler (port 6543).
  // Bump higher if you have a paid plan and run multiple instances.
  DB_POOL_SIZE: optionalString,
  // Set DB_LOG=1 to echo every Drizzle SQL query to the console.
  DB_LOG: optionalString,

  // ── OPTIONAL: Cloudflare Turnstile (CAPTCHA on signup + submit) ──
  // Both must be set together. If unset, captcha is bypassed (dev mode).
  // Get keys at: https://dash.cloudflare.com/?to=/:account/turnstile
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
  TURNSTILE_SECRET_KEY: optionalString,

  // ── OPTIONAL: PostHog (product analytics, free up to 1M events/mo) ──
  // Set NEXT_PUBLIC_POSTHOG_KEY to enable client-side page-view tracking.
  // Leave unset for zero third-party scripts (admin dashboard still works,
  // it queries our own Postgres tables).
  NEXT_PUBLIC_POSTHOG_KEY: optionalString,
  NEXT_PUBLIC_POSTHOG_HOST: optionalString,

  // ── OPTIONAL: Supabase Storage (free image uploads) ─────────────
  // Bucket name created in your Supabase project. Defaults to
  // `prompt-images`. The bucket must be PUBLIC (read) so prompt images
  // render without signed URLs. Run `npm run db:setup-storage` once
  // to provision it idempotently.
  SUPABASE_STORAGE_BUCKET: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.issues, null, 2));
  throw new Error(
    "Invalid environment variables. Check .env.local against .env.example.",
  );
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
