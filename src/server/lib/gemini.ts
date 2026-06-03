import { GoogleGenAI, type GenerateContentResponse, Type } from "@google/genai";
import { env } from "@/server/config/env";

export { Type };

/**
 * Google Gemini client — single cached instance per server runtime.
 *
 * Why a singleton
 * ───────────────
 * The `@google/genai` SDK opens a per-instance HTTP keepalive pool. In
 * a serverless context that pool is per-invocation anyway, but in the
 * Vercel long-lived worker case caching the client reuses connections
 * and trims ~50ms off the cold path.
 *
 * Why no top-level instantiation
 * ──────────────────────────────
 * `GEMINI_API_KEY` is optional — deploys without it must keep building.
 * The factory throws only when actually called, so import-only code
 * paths (e.g. typecheck, test runners) never crash.
 */

const DEFAULT_MODEL = "gemini-2.5-flash";

let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (cached) return cached;
  if (!env.GEMINI_API_KEY) {
    throw new GeminiNotConfiguredError();
  }
  cached = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return cached;
}

export function getGeminiModelName(): string {
  return env.GEMINI_MODEL ?? DEFAULT_MODEL;
}

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super(
      "Gemini is not configured. Set GEMINI_API_KEY in your environment.",
    );
    this.name = "GeminiNotConfiguredError";
  }
}

/** Convenience: returns the raw text body of a Gemini response. */
export function geminiText(res: GenerateContentResponse): string {
  return res.text ?? "";
}
