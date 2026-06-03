import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./user.model";

/**
 * AI prompt-generation audit log.
 *
 * Each row is one call to `POST /api/generate`. The table powers:
 *
 *   1. Per-day + per-minute rate limiting — a quick `COUNT(*)` against
 *      `(user_id, created_at)` decides whether the next request is
 *      allowed.
 *   2. Abuse detection — admins can scan recent rows with `status = 'error'`
 *      or unusual `ip_hash` patterns.
 *   3. Cost tracking — `duration_ms` × Gemini's per-second price gives a
 *      rough usage bill.
 *
 * The full Gemini response is stored as JSONB on success rows so users
 * can re-fetch their last 10 generations without a fresh API call.
 *
 * Privacy: we do NOT store the raw IP. `ip_hash` is a salted SHA-256
 * digest used purely for "same source as 3 other accounts" abuse signals.
 */
export const promptGenerations = pgTable("prompt_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Raw description the user typed in. */
  description: text("description").notNull(),
  /** Parsed Gemini output ({title, prompt, modelSlug, categorySlug, tips}). */
  result: jsonb("result"),
  /** "success" | "error" | "rate_limited" | "moderated". */
  status: text("status").notNull().default("success"),
  /** Last-error message if status != "success". */
  error: text("error"),
  /** Gemini model used (e.g. "gemini-2.5-flash"). Recorded for audit. */
  model: text("model").notNull(),
  /** Total round-trip duration in milliseconds. */
  durationMs: integer("duration_ms"),
  /** Salted SHA-256 of the request IP — privacy-preserving abuse signal. */
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PromptGeneration = typeof promptGenerations.$inferSelect;
export type NewPromptGeneration = typeof promptGenerations.$inferInsert;
