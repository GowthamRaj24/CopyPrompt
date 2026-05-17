import { eq } from "drizzle-orm";
import { db } from "@/server/lib/db";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/server/lib/email";
import { supabaseAdmin } from "@/server/lib/supabase-admin";
import { createClient } from "@/server/lib/supabase-server";
import { users } from "@/server/models/user.model";

/**
 * Auth business logic.
 *
 * Strategy:
 *   - Use Supabase Auth as the identity provider (sessions, password hashing, JWTs)
 *   - Use Nodemailer for ALL email delivery (verification, reset)
 *   - Never call Supabase's built-in email sender (rate-limited)
 */

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthErrorCode =
  | "email_taken"
  | "invalid_credentials"
  | "email_not_verified"
  | "user_not_found"
  | "weak_password"
  | "invalid_token"
  | "unknown";

/**
 * Sign up a new user with email + password.
 *
 * Creates the user in auth.users (unverified), generates a verification link,
 * and sends it via Nodemailer.
 *
 * Returns silently even if the email is already taken (anti-enumeration).
 */
export async function signupWithPassword(
  email: string,
  password: string,
  name?: string,
): Promise<void> {
  // Check if user already exists (we still respond as if successful to avoid email enumeration)
  const existing = await findUserByEmail(email);
  if (existing) {
    // If they exist but haven't verified, we COULD resend the verification,
    // but to minimize spam we just no-op silently.
    return;
  }

  // Use admin generateLink with type='signup': creates user AND returns verification link
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: name ? { full_name: name } : {},
      redirectTo: `${getAppUrl()}/auth/callback?next=/account`,
    },
  });

  if (error) {
    // Common: "User already registered" - swallow it (anti-enumeration)
    if (
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered")
    ) {
      return;
    }
    throw new AuthError("unknown", error.message);
  }

  const verifyUrl = data.properties.action_link;
  if (!verifyUrl) {
    throw new AuthError("unknown", "Supabase did not return a verification link");
  }

  await sendVerificationEmail(email, verifyUrl, name);
}

/**
 * Sign in with email + password. Sets session cookies via the server client.
 * Throws AuthError("email_not_verified") or "invalid_credentials" on failure.
 */
export async function signinWithPassword(
  email: string,
  password: string,
): Promise<{ userId: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed") || msg.includes("not verified")) {
      throw new AuthError(
        "email_not_verified",
        "Please verify your email before signing in. Check your inbox for the verification link.",
      );
    }
    if (msg.includes("invalid") || msg.includes("credentials")) {
      throw new AuthError("invalid_credentials", "Invalid email or password.");
    }
    throw new AuthError("unknown", error.message);
  }

  if (!data.user) {
    throw new AuthError("unknown", "Sign-in succeeded but no user returned");
  }

  return { userId: data.user.id };
}

/**
 * Send a password-reset email. Returns silently even if email isn't registered.
 *
 * We construct a custom link with hashed_token so /reset-password can verify
 * the token AND update the password in a single server call.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) {
    // Anti-enumeration: pretend it worked
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error) {
    throw new AuthError("unknown", error.message);
  }

  const tokenHash = data.properties.hashed_token;
  if (!tokenHash) {
    throw new AuthError("unknown", "Supabase did not return a reset token");
  }

  const resetUrl = `${getAppUrl()}/reset-password?token_hash=${encodeURIComponent(tokenHash)}`;
  await sendPasswordResetEmail(email, resetUrl);
}

/**
 * Reset the password using a recovery token from the email link.
 * The user is implicitly signed in after a successful reset.
 */
export async function resetPasswordWithToken(
  tokenHash: string,
  newPassword: string,
): Promise<void> {
  const supabase = await createClient();

  // Step 1: verify the recovery token (creates a session)
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (verifyErr) {
    throw new AuthError(
      "invalid_token",
      "This password-reset link is invalid or has expired.",
    );
  }

  // Step 2: now signed in via recovery session, update the password
  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateErr) {
    throw new AuthError(
      "weak_password",
      updateErr.message || "Could not update password.",
    );
  }
}

/**
 * Resend the verification email for an unverified account.
 * No-op if the user doesn't exist or is already verified.
 */
export async function resendVerification(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user || user.email_confirmed_at) {
    // Already verified or doesn't exist - silent no-op
    return;
  }

  // generateLink with type='signup' regenerates the verification link for an existing unverified user
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=/account`,
    },
  });

  if (error) {
    throw new AuthError("unknown", error.message);
  }

  const verifyUrl = data.properties.action_link;
  if (!verifyUrl) return;

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? undefined;
  await sendVerificationEmail(email, verifyUrl, fullName);
}

/* ── Helpers ─────────────────────────────────────────────── */

interface FoundUser {
  id: string;
  email_confirmed_at: string | null;
  user_metadata: Record<string, unknown>;
}

/**
 * Look up a user by email.
 *
 * Strategy:
 *   1. Look up our own `public.users` table (indexed unique email, O(1))
 *      to get the user id — works regardless of total user count.
 *   2. If found, fetch the auth user by id via `admin.getUserById`
 *      to get verification state + metadata.
 *
 * This replaces the previous implementation that called `admin.listUsers`
 * page 1 only, which silently broke once user count exceeded 100.
 *
 * Returns null if either step fails to find the user.
 */
async function findUserByEmail(email: string): Promise<FoundUser | null> {
  const lower = email.toLowerCase().trim();

  // Step 1: find the user id from our mirror table (indexed)
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, lower))
    .limit(1);

  if (!row) {
    // Fallback: the public.users trigger may not have fired yet for
    // brand-new signups. Try the auth admin API by email as a last resort.
    // We use `listUsers` with perPage=200 here — still capped, but only
    // hit when the mirror table is genuinely missing the row (rare).
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (error || !data?.users) return null;
      const found = data.users.find((u) => u.email?.toLowerCase() === lower);
      if (!found) return null;
      return {
        id: found.id,
        email_confirmed_at: found.email_confirmed_at ?? null,
        user_metadata: found.user_metadata ?? {},
      };
    } catch {
      return null;
    }
  }

  // Step 2: fetch the auth record by id (constant-time)
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(row.id);
  if (error || !data?.user) return null;

  return {
    id: data.user.id,
    email_confirmed_at: data.user.email_confirmed_at ?? null,
    user_metadata: data.user.user_metadata ?? {},
  };
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
