import { z } from "zod";
import { AuthError, signinWithPassword } from "@/server/services/auth.service";
import { signinSchema } from "@/server/validators/auth.validator";

/**
 * POST /api/auth/signin
 * Body: { email, password }
 *
 * On success: sets session cookies, returns 200 with { userId }.
 * On failure: 401 (bad credentials) or 403 (email not verified).
 */
export async function signinController(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = signinSchema.safeParse(body);
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
    const { userId } = await signinWithPassword(
      parsed.data.email,
      parsed.data.password,
    );
    return new Response(JSON.stringify({ userId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      const status =
        err.code === "email_not_verified"
          ? 403
          : err.code === "invalid_credentials"
            ? 401
            : 400;
      return jsonError(err.message, status);
    }
    console.error("[signin] failed:", err);
    return jsonError("Could not sign in. Try again.", 500);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
