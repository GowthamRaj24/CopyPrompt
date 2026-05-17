import { env } from "@/server/config/env";

/**
 * Cloudflare Turnstile — invisible CAPTCHA, free, no tracking cookies.
 *
 * Why Turnstile (over reCAPTCHA / hCaptcha)
 * ─────────────────────────────────────────
 *   1. Free at any volume.
 *   2. Doesn't load Google scripts. Doesn't collect PII.
 *   3. Invisible to the vast majority of real users (no checkbox click).
 *   4. Same lib for managed / non-interactive / invisible variants.
 *
 * Configure once:
 *   1. Get keys at https://dash.cloudflare.com → Turnstile
 *   2. Add to `.env.local`:
 *        NEXT_PUBLIC_TURNSTILE_SITE_KEY=…
 *        TURNSTILE_SECRET_KEY=…
 *   3. Done. The widget mounts automatically; verification runs server-side.
 *
 * Dev mode
 * ────────
 * If either env var is unset, `verifyTurnstileToken` resolves to `{ok:true}`
 * so local dev and CI don't need to round-trip to Cloudflare. Production
 * MUST set both keys (a small startup warning is logged if you forget).
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;

export interface TurnstileVerifyResult {
  ok: boolean;
  /** Cloudflare's error codes — useful for logs, NEVER show to the user */
  errorCodes?: string[];
  /** When ok=false because env is misconfigured (vs. token fail) */
  configError?: string;
}

/**
 * Verify a Turnstile token from the client widget.
 * Pass `remoteIp` (X-Forwarded-For) when available — Cloudflare uses it for
 * heuristics and you get better signal in production.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const secret = env.TURNSTILE_SECRET_KEY;

  if (!secret || !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    // Captcha disabled — typical in dev. Production should configure both.
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[turnstile] Disabled in production — set TURNSTILE_SECRET_KEY " +
          "and NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable bot protection.",
      );
    }
    return { ok: true, configError: "captcha-disabled" };
  }

  if (!token || token.length < 8) {
    return { ok: false, errorCodes: ["missing-input-response"] };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, errorCodes: [`http-${res.status}`] };
    }

    const json = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    return {
      ok: json.success === true,
      errorCodes: json["error-codes"],
    };
  } catch (err) {
    console.error("[turnstile] verify failed:", err);
    // Fail closed in production (treat network errors as bot-likely)
    // but fail open in dev so local network blips don't break signup.
    return process.env.NODE_ENV === "production"
      ? { ok: false, errorCodes: ["network-error"] }
      : { ok: true, configError: "network-error" };
  }
}

/**
 * Convenience helper for route handlers — takes the parsed JSON body and
 * the Request, extracts the token and remote IP, and returns a normalized
 * result the caller can short-circuit on.
 */
export async function verifyTurnstileFromRequest(
  req: Request,
  token: string | null | undefined,
): Promise<TurnstileVerifyResult> {
  const remoteIp =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  return verifyTurnstileToken(token, remoteIp);
}
