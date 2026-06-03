import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import { generatePrompt } from "@/server/services/prompt-generator.service";

/**
 * POST /api/generate
 *
 * Body: { description: string }
 *
 * Auth: required (signed-in users only).
 * Rate-limited per minute + per day inside the service.
 *
 * Response shapes
 * ───────────────
 *   200 ok:                  GenerateResult with `ok: true`
 *   400 invalid input:       { error, code: "invalid_input" }
 *   401 not signed in:       { error: "Sign in required" }
 *   422 model returned junk: GenerateResult with `ok: false`, model_error
 *   429 rate limited:        GenerateResult with `ok: false`, retry-after
 *   503 not configured:      GenerateResult with `ok: false`, not_configured
 *
 * The client only branches on the `ok` discriminant, so HTTP status
 * differences exist for monitoring / proxy logs only.
 */

// Force Node runtime (not Edge) — the Gemini SDK uses Node-only APIs
// like `node:crypto` for IP hashing and depends on full fetch/Stream
// semantics that the Edge runtime doesn't expose.
export const runtime = "nodejs";

const bodySchema = z.object({
  description: z.string().min(1).max(4_000),
});

function clientIp(req: NextRequest): string | undefined {
  // x-forwarded-for is set by Vercel's edge; first hop is the user.
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return undefined;
}

export async function POST(req: NextRequest) {
  // ── Auth gate ────────────────────────────────────────────
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required to generate prompts." },
      { status: 401 },
    );
  }

  // ── Parse + validate body ────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body must be valid JSON.", code: "invalid_input" },
      { status: 400 },
    );
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Description is missing or too long.",
        code: "invalid_input",
      },
      { status: 400 },
    );
  }

  // ── Run the service ──────────────────────────────────────
  const result = await generatePrompt({
    userId: user.id,
    userPlan: user.plan,
    description: parsed.data.description,
    rawIp: clientIp(req),
  });

  if (result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  // Map failure reasons to HTTP status so monitoring / Vercel logs
  // surface meaningful counts per failure mode.
  const status = (() => {
    switch (result.reason) {
      case "not_configured":
        return 503;
      case "input_too_short":
      case "input_too_long":
        return 400;
      case "rate_limit_minute":
      case "rate_limit_day":
        return 429;
      case "moderated":
        return 422;
      case "model_error":
        return 502;
      default:
        return 400;
    }
  })();

  const headers: Record<string, string> = {};
  if (result.retryAfterSec) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }

  return NextResponse.json(result, { status, headers });
}
