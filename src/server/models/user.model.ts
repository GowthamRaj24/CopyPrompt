import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Public users table that mirrors Supabase auth.users.
 * A trigger on auth.users insert keeps this in sync (added in a later migration).
 *
 * The id matches auth.users.id exactly so we can join.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  plan: text("plan", { enum: ["free", "premium", "admin"] })
    .notNull()
    .default("free"),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
