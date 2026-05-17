import { z } from "zod";
import { resendVerification } from "@/server/services/auth.service";
import { resendVerificationSchema } from "@/server/validators/auth.validator";

const GENERIC_RESPONSE = {
  message:
    "If that email is unverified, a fresh verification link has been sent.",
};

/**
 * POST /api/auth/resend-verification
 * Body: { email }
 *
 * Always returns the same generic message to prevent email enumeration.
 */
export async function resendVerificationController(
  req: Request,
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = resendVerificationSchema.safeParse(body);
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
    await resendVerification(parsed.data.email);
  } catch (err) {
    console.error("[resendVerification] failed:", err);
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
