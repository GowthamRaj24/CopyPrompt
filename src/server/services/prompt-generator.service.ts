import { and, eq, gte, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { RATE_LIMITS } from "@/server/config/constants";
import { env } from "@/server/config/env";
import { db } from "@/server/lib/db";
import {
  GeminiNotConfiguredError,
  geminiText,
  getGemini,
  getGeminiModelName,
  Type,
} from "@/server/lib/gemini";
import { promptGenerations } from "@/server/models/generation.model";

/**
 * Prompt-generation service.
 *
 * Pipeline:
 *   1. Quota check — per-minute + per-day windows against `prompt_generations`.
 *   2. Gemini call — `gemini-2.5-flash`, structured JSON output, 8s timeout.
 *   3. Output validation — strict shape; reject if Gemini went off-script.
 *   4. Audit insert — success OR failure row so abuse scans see everything.
 *
 * The function is intentionally "wide" (one big object back to the caller)
 * because the UI shows the generated prompt + remaining quota + (when
 * something goes wrong) a friendly reason string. Callers should not
 * branch on `error` for control flow — the `ok` discriminant does that.
 */

export type GenerateResult =
  | {
      ok: true;
      generationId: string;
      title: string;
      prompt: string;
      modelSlug: string;
      categorySlug: string;
      tips: string;
      quotaRemainingToday: number;
    }
  | {
      ok: false;
      reason:
        | "not_configured"
        | "input_too_short"
        | "input_too_long"
        | "rate_limit_minute"
        | "rate_limit_day"
        | "moderated"
        | "model_error";
      message: string;
      quotaRemainingToday?: number;
      retryAfterSec?: number;
    };

export interface GenerateInput {
  userId: string;
  userPlan: "free" | "premium" | "admin";
  description: string;
  /** Raw request IP — hashed before being stored; never persisted as-is. */
  rawIp?: string;
}

const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 2_000;
const GEMINI_TIMEOUT_MS = 12_000;

/**
 * The IP-hash salt rotates per-process. That's a feature: each deploy
 * gets a fresh salt so a leaked DB dump can't be cross-referenced with
 * past requests after a redeploy. Within one process the salt stays
 * stable so the same IP hashes consistently for abuse-pattern detection.
 */
const IP_HASH_SALT = randomBytes(32).toString("hex");

function hashIp(ip: string): string {
  return createHash("sha256").update(IP_HASH_SALT).update(ip).digest("hex");
}

function dailyLimitFor(plan: "free" | "premium" | "admin"): number {
  if (plan === "admin") return Number.POSITIVE_INFINITY;
  if (plan === "premium") return RATE_LIMITS.GENERATE_PREMIUM_PER_DAY;
  return RATE_LIMITS.GENERATE_FREE_PER_DAY;
}

/**
 * Count this user's successful generations in the rolling 24h window.
 * We intentionally count only `status = 'success'` so that rate-limit
 * rejections don't further block the user — that would create a
 * "refused to even let me retry" footgun.
 */
async function countDay(userId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(promptGenerations)
    .where(
      and(
        eq(promptGenerations.userId, userId),
        eq(promptGenerations.status, "success"),
        gte(promptGenerations.createdAt, since),
      ),
    );
  return row?.c ?? 0;
}

async function countMinute(userId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 1000);
  const [row] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(promptGenerations)
    .where(
      and(
        eq(promptGenerations.userId, userId),
        gte(promptGenerations.createdAt, since),
      ),
    );
  return row?.c ?? 0;
}

/* ════════════════════════════════════════════════════════════════
   SYSTEM PROMPT — the contract Gemini runs against.
   Kept as a constant so it's diffable in code review; tweak it here.
   ════════════════════════════════════════════════════════════════ */

const SYSTEM_INSTRUCTION = `You are a senior prompt engineer. Given a user's plain-English description of what they want help with, generate ONE production-quality AI prompt they can copy-paste into ChatGPT, Claude, Gemini, Midjourney, Flux, or any other major AI tool.

Rules for the prompt you generate:
- Open with a role + objective sentence ("You are X. Your job is Y.").
- Use {PLACEHOLDER_TOKENS} for the parts the user must fill in.
- Include a "Rules" block listing 4-7 specific dos and don'ts.
- Specify the output format the user wants back.
- End with a concrete "do not" line that catches the most common AI failure mode for this task.
- Length: 150-600 words. No fluff.
- Plain English. No corporate-speak. No "leverage", "synergy", "rockstar".

Also pick:
- modelSlug — one of:
  text:   chatgpt, chatgpt-5, claude-sonnet, claude-opus, gemini, grok, deepseek, llama, mistral, perplexity, copilot, pi, any-llm
  image:  flux-dev, flux-schnell, flux-pro, flux-kontext, midjourney, stable-diffusion-xl, stable-diffusion-3, dall-e-3, ideogram, leonardo-ai, adobe-firefly, imagen, recraft
- categorySlug — one of:
  validation-strategy, coding-development, writing-content, marketing-sales, analysis-research, productivity, learning-education, personal-career,
  image-generation, cinematic-portraits, product-photography, logo-design, anime-illustration, fantasy-characters, architecture, abstract-art
- A 4-12 word title for the prompt (no emoji, no quotes).
- A single 1-2 sentence tip about how to get the best results from this prompt (variable to set carefully, model param to tweak, etc.).

Output STRICTLY as a single JSON object matching this TypeScript type:
{ "title": string, "prompt": string, "modelSlug": string, "categorySlug": string, "tips": string }

No markdown. No code fences. No commentary outside the JSON.`;

/* ════════════════════════════════════════════════════════════════
   OUTPUT VALIDATION
   ════════════════════════════════════════════════════════════════ */

const ALLOWED_MODELS = new Set([
  "chatgpt",
  "chatgpt-5",
  "claude-sonnet",
  "claude-opus",
  "gemini",
  "grok",
  "deepseek",
  "llama",
  "mistral",
  "perplexity",
  "copilot",
  "pi",
  "any-llm",
  "flux-dev",
  "flux-schnell",
  "flux-pro",
  "flux-kontext",
  "midjourney",
  "stable-diffusion-xl",
  "stable-diffusion-3",
  "dall-e-3",
  "ideogram",
  "leonardo-ai",
  "adobe-firefly",
  "imagen",
  "recraft",
]);

const ALLOWED_CATEGORIES = new Set([
  "validation-strategy",
  "coding-development",
  "writing-content",
  "marketing-sales",
  "analysis-research",
  "productivity",
  "learning-education",
  "personal-career",
  "image-generation",
  "cinematic-portraits",
  "product-photography",
  "logo-design",
  "anime-illustration",
  "fantasy-characters",
  "architecture",
  "abstract-art",
]);

interface GeminiPromptOutput {
  title: string;
  prompt: string;
  modelSlug: string;
  categorySlug: string;
  tips: string;
}

/**
 * Try multiple strategies to extract a JSON object from Gemini's text.
 * Even with `responseSchema` + `responseMimeType: application/json`
 * set, occasional responses still arrive with prose, markdown fences,
 * or trailing commentary. We try them in order:
 *
 *   1. Direct parse of the raw text.
 *   2. Strip ```json … ``` fences and parse.
 *   3. Find the FIRST balanced { … } block in the string and parse that.
 *
 * Returns the first parse that yields an object, or null if all fail.
 */
function extractJsonObject(raw: string): Record<string, unknown> | null {
  const tryParse = (s: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(s);
      return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  };

  // 1. Direct parse.
  const direct = tryParse(raw.trim());
  if (direct) return direct;

  // 2. Strip code fences.
  const fenced = raw
    .replace(/^[^`]*```(?:json)?\s*/i, "")
    .replace(/\s*```[^`]*$/i, "")
    .trim();
  const afterFence = tryParse(fenced);
  if (afterFence) return afterFence;

  // 3. Find the first balanced JSON object substring. Walk the string
  //    tracking brace depth, ignoring braces inside string literals.
  const firstBrace = raw.indexOf("{");
  if (firstBrace >= 0) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = firstBrace; i < raw.length; i++) {
      const ch = raw[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const slice = raw.slice(firstBrace, i + 1);
          const parsed = tryParse(slice);
          if (parsed) return parsed;
          break;
        }
      }
    }
  }
  return null;
}

function parseGeminiJson(raw: string): GeminiPromptOutput | null {
  const obj = extractJsonObject(raw);
  if (!obj) return null;
  if (
    typeof obj.title !== "string" ||
    typeof obj.prompt !== "string" ||
    typeof obj.modelSlug !== "string" ||
    typeof obj.categorySlug !== "string" ||
    typeof obj.tips !== "string"
  ) {
    return null;
  }
  // Sanity bounds — relaxed so short-but-valid prompts (e.g. quick
  // image prompts) aren't rejected.
  if (obj.title.length < 3 || obj.title.length > 240) return null;
  if (obj.prompt.length < 40 || obj.prompt.length > 6_000) return null;
  // Coerce unknown slugs back to safe defaults so the UI never shows
  // a "category-not-found" link.
  const modelSlug = ALLOWED_MODELS.has(obj.modelSlug)
    ? obj.modelSlug
    : "any-llm";
  const categorySlug = ALLOWED_CATEGORIES.has(obj.categorySlug)
    ? obj.categorySlug
    : "writing-content";
  return {
    title: obj.title.trim().slice(0, 120),
    prompt: obj.prompt.trim(),
    modelSlug,
    categorySlug,
    tips: obj.tips.trim().slice(0, 280),
  };
}

/**
 * Gemini's structured-output schema for the generator. Setting this
 * (paired with `responseMimeType: application/json`) makes Gemini
 * return a JSON object guaranteed to match the structure — eliminating
 * the "model returned prose instead of JSON" failure mode that was
 * showing up as `model_returned_invalid_json` in our audit log.
 */
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    prompt: { type: Type.STRING },
    modelSlug: { type: Type.STRING },
    categorySlug: { type: Type.STRING },
    tips: { type: Type.STRING },
  },
  required: ["title", "prompt", "modelSlug", "categorySlug", "tips"],
  propertyOrdering: [
    "title",
    "prompt",
    "modelSlug",
    "categorySlug",
    "tips",
  ],
} as const;

/* ════════════════════════════════════════════════════════════════
   MAIN ENTRY POINT
   ════════════════════════════════════════════════════════════════ */

export async function generatePrompt(
  input: GenerateInput,
): Promise<GenerateResult> {
  const description = input.description.trim();

  if (description.length < DESCRIPTION_MIN) {
    return {
      ok: false,
      reason: "input_too_short",
      message: `Tell us more about what you want — at least ${DESCRIPTION_MIN} characters.`,
    };
  }
  if (description.length > DESCRIPTION_MAX) {
    return {
      ok: false,
      reason: "input_too_long",
      message: `Keep your description under ${DESCRIPTION_MAX} characters.`,
    };
  }

  if (!env.GEMINI_API_KEY) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "Prompt generation isn't available right now. The admin needs to add an API key.",
    };
  }

  // ── Quota checks ─────────────────────────────────────────
  const [minuteUsed, dayUsed] = await Promise.all([
    countMinute(input.userId),
    countDay(input.userId),
  ]);

  if (minuteUsed >= RATE_LIMITS.GENERATE_PER_MINUTE) {
    return {
      ok: false,
      reason: "rate_limit_minute",
      message:
        "You're going fast — take a breath. Try again in a few seconds.",
      retryAfterSec: 30,
    };
  }

  const dayLimit = dailyLimitFor(input.userPlan);
  if (dayUsed >= dayLimit) {
    return {
      ok: false,
      reason: "rate_limit_day",
      message: `Daily limit reached (${dayLimit} prompts). It resets 24h after your first generation today.`,
      quotaRemainingToday: 0,
    };
  }

  // ── Call Gemini ──────────────────────────────────────────
  const startedAt = Date.now();
  const modelName = getGeminiModelName();

  const ipHash = input.rawIp ? hashIp(input.rawIp) : null;

  try {
    const client = getGemini();

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      GEMINI_TIMEOUT_MS,
    );

    let textOut: string;
    try {
      const res = await client.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [{ text: description }],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // `responseMimeType` + `responseSchema` together force the
          // model into structured JSON mode — much more reliable than
          // prompting for JSON in the system instruction alone.
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.7,
          maxOutputTokens: 2_000,
          abortSignal: controller.signal,
        },
      });
      textOut = geminiText(res);
    } finally {
      clearTimeout(timeout);
    }

    const parsed = parseGeminiJson(textOut);
    if (!parsed) {
      // Store the actual raw response (truncated) so we can debug
      // model-side regressions later from the audit log, instead of
      // burning a generic "model_returned_invalid_json" with no clue
      // about what came back.
      const snippet = (textOut ?? "").slice(0, 480);
      console.error(
        "[generate] Failed to parse Gemini response. Raw output (truncated):",
        snippet,
      );
      await db.insert(promptGenerations).values({
        userId: input.userId,
        description,
        status: "error",
        error: `parse_failed: ${snippet}`.slice(0, 500),
        model: modelName,
        durationMs: Date.now() - startedAt,
        ipHash,
      });
      return {
        ok: false,
        reason: "model_error",
        message:
          "We couldn't parse the model's reply. Try rewording your description a bit.",
      };
    }

    const [inserted] = await db
      .insert(promptGenerations)
      .values({
        userId: input.userId,
        description,
        result: parsed,
        status: "success",
        model: modelName,
        durationMs: Date.now() - startedAt,
        ipHash,
      })
      .returning({ id: promptGenerations.id });

    const remaining =
      dayLimit === Number.POSITIVE_INFINITY
        ? Number.POSITIVE_INFINITY
        : Math.max(0, dayLimit - dayUsed - 1);

    return {
      ok: true,
      generationId: inserted?.id ?? "",
      title: parsed.title,
      prompt: parsed.prompt,
      modelSlug: parsed.modelSlug,
      categorySlug: parsed.categorySlug,
      tips: parsed.tips,
      quotaRemainingToday: remaining,
    };
  } catch (err) {
    if (err instanceof GeminiNotConfiguredError) {
      return {
        ok: false,
        reason: "not_configured",
        message: err.message,
      };
    }
    const message =
      err instanceof Error ? err.message : "Unknown Gemini error";

    await db.insert(promptGenerations).values({
      userId: input.userId,
      description,
      status: "error",
      error: message.slice(0, 500),
      model: modelName,
      durationMs: Date.now() - startedAt,
      ipHash,
    });

    return {
      ok: false,
      reason: "model_error",
      message:
        "The AI service is having a moment. Please try again in a minute.",
    };
  }
}

/**
 * For the /generate page header: how many generations the user has
 * left today. Returns Infinity for admins.
 */
export async function getRemainingQuotaToday(
  userId: string,
  plan: "free" | "premium" | "admin",
): Promise<number> {
  const limit = dailyLimitFor(plan);
  if (limit === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
  const used = await countDay(userId);
  return Math.max(0, limit - used);
}
