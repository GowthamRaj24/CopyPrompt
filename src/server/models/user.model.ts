import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Public users table that mirrors Supabase auth.users.
 * A trigger on auth.users insert keeps this in sync (added in a later migration).
 *
 * The id matches auth.users.id exactly so we can join.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  /**
   * Public URL handle (creator profile lives at `/u/<handle>`).
   * Required + unique; backfilled per the 0009 migration.
   */
  handle: text("handle").notNull().unique(),
  /** Free-form bio shown on the public creator profile. */
  bio: text("bio"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  plan: text("plan", { enum: ["free", "premium", "admin"] })
    .notNull()
    .default("free"),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  /** Set when the welcome email has been sent — null = needs welcome. */
  welcomedAt: timestamp("welcomed_at", { withTimezone: true }),
  /**
   * Denormalized contributor stats — kept current by:
   *   - admin approval flow (bumps publish count immediately)
   *   - daily cron `/api/cron/refresh-contributor-stats` (refreshes both)
   * Powers the /contributors leaderboard and creator-profile badges.
   */
  totalCopiesReceived: integer("total_copies_received").notNull().default(0),
  totalPromptsPublished: integer("total_prompts_published").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
