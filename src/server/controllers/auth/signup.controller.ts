import { z } from "zod";
import { verifyTurnstileFromRequest } from "@/server/lib/turnstile";
import { AuthError, signupWithPassword } from "@/server/services/auth.service";
import { signupSchema } from "@/server/validators/auth.validator";

const GENERIC_RESPONSE = {
  message:
    "If your email is new, a verification link has been sent. Check your inbox to finish creating your account.",
};

/**
 * POST /api/auth/signup
 * Body: { email, password, name?, captchaToken? }
 *
 * Always returns the same generic message to prevent email enumeration.
 * Verifies a Cloudflare Turnstile token before doing any DB or Supabase
 * work — bot signups are rejected for free, before they cost us a row.
 */
export async function signupController(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        issues: z.treeifyError(parsed.error),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const captcha = await verifyTurnstileFromRequest(req, parsed.data.captchaToken);
  if (!captcha.ok) {
    return jsonError(
      "Captcha verification failed. Please refresh and try again.",
      400,
    );
  }

  try {
    await signupWithPassword(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name,
    );
    return new Response(JSON.stringify(GENERIC_RESPONSE), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return jsonError(err.message, 400);
    }
    console.error("[signup] failed:", err);
    return jsonError("Could not create account. Try again.", 500);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
