import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import { verifyTurnstileFromRequest } from "@/server/lib/turnstile";
import { createPrivatePrompt } from "@/server/services/private-prompt.service";
import { submissionWireSchema } from "@/server/validators/submission.validator";

/**
 * POST /api/prompts/private
 * Instant private prompt + share link.
 */
export async function createPrivatePromptController(
  req: Request,
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("You must be signed in to create a private prompt.", 401);
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
      { status: 400, headers: { "Content-Type": "application/json" } },
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

  const { captchaToken: _ignored, ...submissionInput } = parsed.data;

  try {
    const result = await createPrivatePrompt(submissionInput, user.id);
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create private prompt";
    const status = message.includes("per day") ? 429 : 500;
    console.error("Private prompt create failed", err);
    return jsonError(message, status);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
