import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import { verifyTurnstileFromRequest } from "@/server/lib/turnstile";
import { createSubmission } from "@/server/services/submission.service";
import { submissionWireSchema } from "@/server/validators/submission.validator";

/**
 * POST /api/submit
 *
 * Body: SubmissionInput + { captchaToken? }
 * Auth: required (returns 401 if not signed in).
 *
 * Order of checks is intentional:
 *   1. Auth   — cheap, no I/O
 *   2. JSON   — cheap
 *   3. Schema — Zod, no I/O
 *   4. Captcha — one HTTP round-trip to Cloudflare
 *   5. DB write
 * Anything that fails earlier never costs us a downstream call.
 */
export async function createSubmissionController(
  req: Request,
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("You must be signed in to submit a prompt.", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = submissionWireSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        issues: z.treeifyError(parsed.error),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const captcha = await verifyTurnstileFromRequest(
    req,
    parsed.data.captchaToken,
  );
  if (!captcha.ok) {
    return jsonError(
      "Captcha verification failed. Please refresh and try again.",
      400,
    );
  }

  const ipAddress =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const { captchaToken: _ignored, ...submissionInput } = parsed.data;

  try {
    const { id } = await createSubmission(submissionInput, {
      userId: user.id,
      userEmail: user.email,
      ipAddress,
      userAgent,
    });
    return new Response(JSON.stringify({ id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Submission insert failed", err);
    return jsonError("Could not save submission", 500);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
