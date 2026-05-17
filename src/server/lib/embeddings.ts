import Together from "together-ai";
import { env } from "@/server/config/env";

/** Matches `prompts.embedding vector(768)` and BAAI/bge-base-en-v1.5. */
export const EMBEDDING_DIMENSIONS = 768;

const BGE_MODEL = "BAAI/bge-base-en-v1.5";
const QUERY_PREFIX =
  "Represent this sentence for searching relevant passages: ";
const MAX_CHARS = 8_000;

export function isEmbeddingConfigured(): boolean {
  return Boolean(env.TOGETHER_API_KEY ?? env.HF_TOKEN ?? env.JINA_API_KEY);
}

export function buildEmbeddingText(fields: {
  title: string;
  promptText: string;
  tips?: string | null;
  expectedOutcome?: string | null;
}): string {
  const parts = [fields.title.trim(), fields.promptText.trim()];
  if (fields.tips?.trim()) parts.push(fields.tips.trim());
  if (fields.expectedOutcome?.trim()) parts.push(fields.expectedOutcome.trim());
  return parts.join("\n\n").slice(0, MAX_CHARS);
}

/** Embed a user search query (BGE query instruction prefix). */
export async function embedQuery(text: string): Promise<number[]> {
  const trimmed = text.trim().slice(0, MAX_CHARS);
  if (!trimmed) throw new Error("embedQuery: empty text");
  return embedText(QUERY_PREFIX + trimmed);
}

/** Embed prompt content for storage / similarity (no query prefix). */
export async function embedDocument(text: string): Promise<number[]> {
  const trimmed = text.trim().slice(0, MAX_CHARS);
  if (!trimmed) throw new Error("embedDocument: empty text");
  return embedText(trimmed);
}

async function embedText(text: string): Promise<number[]> {
  if (env.TOGETHER_API_KEY) {
    try {
      return await embedViaTogether(text);
    } catch (err) {
      if (!env.HF_TOKEN) throw err;
      console.warn("[embeddings] Together failed, trying Hugging Face:", err);
    }
  }
  if (env.HF_TOKEN) {
    try {
      return await embedViaHuggingFace(text);
    } catch (err) {
      if (!env.JINA_API_KEY) throw err;
      console.warn("[embeddings] Hugging Face failed, trying Jina:", err);
    }
  }
  if (env.JINA_API_KEY) {
    return embedViaJina(text);
  }
  throw new Error(
    "No embedding API configured. Set TOGETHER_API_KEY, HF_TOKEN, or JINA_API_KEY in .env.local",
  );
}

async function embedViaJina(text: string): Promise<number[]> {
  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.JINA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jina-embeddings-v2-base-en",
      input: [text],
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Jina embeddings ${res.status}: ${raw.slice(0, 300)}`);
  }
  const json = JSON.parse(raw) as {
    data?: Array<{ embedding?: number[] }>;
  };
  const vec = json.data?.[0]?.embedding;
  if (!vec?.length) throw new Error("Jina returned empty embedding");
  return normalizeVector(vec);
}

async function embedViaTogether(text: string): Promise<number[]> {
  const client = new Together({ apiKey: env.TOGETHER_API_KEY });
  const res = await client.embeddings.create({
    model: BGE_MODEL,
    input: text,
  });
  const vec = res.data[0]?.embedding;
  if (!vec?.length) throw new Error("Together embeddings returned empty data");
  return normalizeVector(vec);
}

const HF_ROUTER_URL = `https://router.huggingface.co/hf-inference/models/${BGE_MODEL}/pipeline/feature-extraction`;
const HF_MODELS_URL = `https://api-inference.huggingface.co/models/${BGE_MODEL}`;

async function embedViaHuggingFace(text: string): Promise<number[]> {
  const headers = {
    Authorization: `Bearer ${env.HF_TOKEN}`,
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({ inputs: text });

  const urls = [HF_ROUTER_URL, HF_MODELS_URL];
  let lastError = "unknown error";

  for (const url of urls) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120_000);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });
        const raw = await res.text();

        if (!res.ok) {
          if (res.status === 403) {
            throw new Error(
              'HF_TOKEN cannot call Inference Providers (403). Create a fine-grained token with "Make calls to Inference Providers" enabled: https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained — or set JINA_API_KEY from https://jina.ai/?sui=apikey',
            );
          }
          const retryable =
            res.status === 503 ||
            res.status === 504 ||
            raw.includes("loading") ||
            raw.includes("Loading");
          lastError = `Hugging Face ${res.status}: ${raw.slice(0, 300)}`;
          if (retryable && attempt < 4) {
            await sleep(3_000 * (attempt + 1));
            continue;
          }
          break;
        }

        const data: unknown = JSON.parse(raw);
        return normalizeVector(poolHfOutput(data));
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < 4) {
          await sleep(3_000 * (attempt + 1));
          continue;
        }
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw new Error(
    `${lastError}. Ensure HF_TOKEN has "Inference Providers" permission (https://huggingface.co/settings/tokens).`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** HF feature-extraction may return [dim] or [tokens][dim]. */
function poolHfOutput(data: unknown): number[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Unexpected Hugging Face embedding shape");
  }
  if (typeof data[0] === "number") {
    return data as number[];
  }
  if (Array.isArray(data[0])) {
    const rows = data as number[][];
    const dim = rows[0]?.length ?? 0;
    if (dim === 0) throw new Error("Empty token embeddings from Hugging Face");
    const sum = new Array<number>(dim).fill(0);
    for (const row of rows) {
      for (let i = 0; i < dim; i++) sum[i] += row[i] ?? 0;
    }
    return sum.map((v) => v / rows.length);
  }
  throw new Error("Unexpected Hugging Face embedding shape");
}

function normalizeVector(vec: number[]): number[] {
  if (vec.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS}-dim vector, got ${vec.length}`,
    );
  }
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm < 1e-12) return vec;
  return vec.map((v) => v / norm);
}

/** Parse pgvector value from Postgres (string or number[]). */
export function parseStoredEmbedding(
  value: unknown,
): number[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.every((n) => typeof n === "number") ? (value as number[]) : null;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
        return parsed as number[];
      }
    } catch {
      const inner = value.replace(/^\[|\]$/g, "");
      if (!inner.trim()) return null;
      return inner.split(",").map((s) => Number.parseFloat(s.trim()));
    }
  }
  return null;
}
