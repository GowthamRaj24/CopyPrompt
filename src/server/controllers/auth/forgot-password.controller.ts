import { z } from "zod";
import { requestPasswordReset } from "@/server/services/auth.service";
import { forgotPasswordSchema } from "@/server/validators/auth.validator";

const GENERIC_RESPONSE = {
  message:
    "If that email has an account, a reset link has been sent. Check your inbox.",
};

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Always returns the same generic message to prevent email enumeration.
 */
export async function forgotPasswordController(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        issues: z.treeifyError(parsed.error),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    await requestPasswordReset(parsed.data.email);
  } catch (err) {
    // Even on failure, return success - never reveal whether the email exists
    console.error("[forgotPassword] failed:", err);
  }

  return new Response(JSON.stringify(GENERIC_RESPONSE), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
