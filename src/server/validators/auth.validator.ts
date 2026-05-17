import { z } from "zod";

/**
 * Schemas for email + password auth flows.
 * Mirrors the password-based approach.
 */

export const PASSWORD_MIN_LENGTH = 10;

const emailField = z
  .string()
  .email("Enter a valid email")
  .toLowerCase()
  .trim();

const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(200, "Password too long");

/* ── Signup ──────────────────────────────────────────────── */

/**
 * Token returned by the Cloudflare Turnstile widget after a successful
 * challenge. Optional in the schema because the server verifier no-ops
 * cleanly when keys aren't configured (dev / CI). In production the
 * verifier requires it.
 */
const captchaTokenField = z.string().max(2048).nullable().optional();

export const signupSchema = z.object({
  email: emailField,
  password: passwordField,
  name: z
    .string()
    .max(100, "Name too long")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  captchaToken: captchaTokenField,
});

/* ── Sign in ─────────────────────────────────────────────── */

export const signinSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required").max(200),
});

/* ── Forgot password ─────────────────────────────────────── */

export const forgotPasswordSchema = z.object({
  email: emailField,
});

/* ── Reset password ──────────────────────────────────────── */

export const resetPasswordSchema = z.object({
  /** The token from the recovery email link (Supabase token_hash) */
  tokenHash: z.string().min(1, "Token is required"),
  password: passwordField,
});

/* ── Resend verification ─────────────────────────────────── */

export const resendVerificationSchema = z.object({
  email: emailField,
});

/* ── Types ───────────────────────────────────────────────── */

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
