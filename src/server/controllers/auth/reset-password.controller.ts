import { z } from "zod";
import {
  AuthError,
  resetPasswordWithToken,
} from "@/server/services/auth.service";
import { resetPasswordSchema } from "@/server/validators/auth.validator";

/**
 * POST /api/auth/reset-password
 * Body: { tokenHash, password }
 *
 * Verifies the recovery token, sets the new password, and signs the user in.
 */
export async function resetPasswordController(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = resetPasswordSchema.safeParse(body);
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
    await resetPasswordWithToken(parsed.data.tokenHash, parsed.data.password);
    return new Response(
      JSON.stringify({ message: "Password reset. You're now signed in." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return jsonError(err.message, 400);
    }
    console.error("[resetPassword] failed:", err);
    return jsonError("Could not reset password. Try again.", 500);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
