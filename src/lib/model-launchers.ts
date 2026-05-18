/**
 * Deep links to open a specific AI tool with the user's prompt ready to paste.
 *
 * Why this exists
 * ───────────────
 * Right after a copy, the highest-friction step is "now switch tabs and find
 * the model". Wherever a model publishes a deep link that pre-fills the
 * chat input, we use it; otherwise we open the official home/chat URL and
 * rely on the clipboard contents the user just placed.
 *
 * Safety
 * ──────
 *   - Pre-fill query params are skipped when the prompt is longer than
 *     URL_PREFILL_LIMIT (browsers and proxies start dropping URLs past
 *     ~3000 chars). The clipboard always wins, so the user never loses
 *     the prompt.
 *   - All slugs match `seed-base.ts` exactly.
 */

const URL_PREFILL_LIMIT = 3000;

export interface ModelLauncher {
  /** Display label, e.g. "Open ChatGPT" */
  label: string;
  /**
   * Build a deep link for this prompt.
   * `prompt` is the raw text the user just copied.
   */
  build: (prompt: string) => string;
  /**
   * If true, the deep link reliably pre-fills the chat input.
   * If false, we only open the model's home page and the user pastes
   * from clipboard. Used to tune the toast copy.
   */
  prefills: boolean;
}

function withQuery(base: string, key: string, value: string): string {
  if (value.length > URL_PREFILL_LIMIT) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${key}=${encodeURIComponent(value)}`;
}

/**
 * Map from `models.slug` → launcher.
 * Slugs not in this map fall back to `getModelLauncher`'s default.
 */
const LAUNCHERS: Record<string, ModelLauncher> = {
  // ─── Text models ──────────────────────────────────────────
  chatgpt: {
    label: "Open ChatGPT",
    build: (p) => withQuery("https://chatgpt.com/", "q", p),
    prefills: true,
  },
  "chatgpt-5": {
    label: "Open ChatGPT",
    build: (p) => withQuery("https://chatgpt.com/", "q", p),
    prefills: true,
  },
  "claude-sonnet": {
    label: "Open Claude",
    build: (p) => withQuery("https://claude.ai/new", "q", p),
    prefills: true,
  },
  "claude-opus": {
    label: "Open Claude",
    build: (p) => withQuery("https://claude.ai/new", "q", p),
    prefills: true,
  },
  gemini: {
    label: "Open Gemini",
    build: () => "https://gemini.google.com/app",
    prefills: false,
  },
  grok: {
    label: "Open Grok",
    build: (p) => withQuery("https://grok.com/", "q", p),
    prefills: true,
  },
  deepseek: {
    label: "Open DeepSeek",
    build: () => "https://chat.deepseek.com/",
    prefills: false,
  },
  llama: {
    label: "Open Meta AI",
    build: () => "https://www.meta.ai/",
    prefills: false,
  },
  mistral: {
    label: "Open Mistral",
    build: () => "https://chat.mistral.ai/",
    prefills: false,
  },
  perplexity: {
    label: "Open Perplexity",
    build: (p) => withQuery("https://www.perplexity.ai/search", "q", p),
    prefills: true,
  },
  copilot: {
    label: "Open Copilot",
    build: () => "https://copilot.microsoft.com/",
    prefills: false,
  },
  pi: {
    label: "Open Pi",
    build: () => "https://pi.ai/talk",
    prefills: false,
  },

  // ─── Image models ─────────────────────────────────────────
  "flux-dev": {
    label: "Open Flux",
    build: () => "https://playground.bfl.ai/",
    prefills: false,
  },
  "flux-schnell": {
    label: "Open Flux",
    build: () => "https://playground.bfl.ai/",
    prefills: false,
  },
  "flux-pro": {
    label: "Open Flux",
    build: () => "https://playground.bfl.ai/",
    prefills: false,
  },
  "flux-kontext": {
    label: "Open Flux",
    build: () => "https://playground.bfl.ai/",
    prefills: false,
  },
  midjourney: {
    label: "Open Midjourney",
    build: () => "https://www.midjourney.com/imagine",
    prefills: false,
  },
  "stable-diffusion-xl": {
    label: "Open DreamStudio",
    build: () => "https://beta.dreamstudio.ai/generate",
    prefills: false,
  },
  "stable-diffusion-3": {
    label: "Open DreamStudio",
    build: () => "https://beta.dreamstudio.ai/generate",
    prefills: false,
  },
  "dall-e-3": {
    label: "Open ChatGPT",
    build: (p) => withQuery("https://chatgpt.com/", "q", p),
    prefills: true,
  },
  ideogram: {
    label: "Open Ideogram",
    build: () => "https://ideogram.ai/",
    prefills: false,
  },
  "leonardo-ai": {
    label: "Open Leonardo",
    build: () => "https://app.leonardo.ai/",
    prefills: false,
  },
  "adobe-firefly": {
    label: "Open Firefly",
    build: () => "https://firefly.adobe.com/",
    prefills: false,
  },
  imagen: {
    label: "Open Google AI Studio",
    build: () => "https://aistudio.google.com/",
    prefills: false,
  },
  recraft: {
    label: "Open Recraft",
    build: () => "https://www.recraft.ai/",
    prefills: false,
  },
};

/**
 * Get the launcher for a model slug. Returns `null` when there is no
 * sensible deep-link target — callers should skip the secondary CTA.
 */
export function getModelLauncher(slug: string | null | undefined): ModelLauncher | null {
  if (!slug) return null;
  return LAUNCHERS[slug] ?? null;
}
