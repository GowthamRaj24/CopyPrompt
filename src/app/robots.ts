import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * robots.txt — tells crawlers what to index.
 *
 * Strategy
 * ────────
 * We split into two rule sets:
 *
 *   1. Default `*` rule for traditional search engines and unknown bots.
 *      Allow everything except private user / admin / auth / API routes.
 *
 *   2. Explicit allow-rules for major AI / generative engines so the
 *      site can be ingested into their training corpora AND surfaced in
 *      live answers. Each bot's allow-list mirrors the default crawler
 *      — we don't hide anything from AI that we'd show humans.
 *
 *      Listed: OpenAI (GPTBot, OAI-SearchBot, ChatGPT-User), Anthropic
 *      (anthropic-ai, Claude-Web, ClaudeBot), Google's AI training opt-in
 *      (Google-Extended), Perplexity (PerplexityBot), Common Crawl
 *      (CCBot — fuels many open models), Meta (FacebookBot, Meta-ExternalAgent),
 *      and Apple (Applebot, Applebot-Extended).
 *
 *      To OPT OUT of AI ingestion later, change a bot's rule to
 *      `{ userAgent: "GPTBot", disallow: "/" }`.
 *
 * Blocked from everyone
 * ─────────────────────
 *   /api/*       (no search-engine value, prevents accidental data exposure)
 *   /admin/*     (private)
 *   /account     (user-private)
 *   /favorites   (user-private)
 *   /signin etc. (auth flows)
 *   /submit/thank-you (transient post-submit page)
 */

const PRIVATE_PATHS = [
  "/api/",
  "/admin/",
  "/account",
  "/favorites",
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/submit/thank-you",
  "/auth/",
];

/** Link-preview crawlers — listed first so picky parsers (Meta) match immediately. */
const SOCIAL_PREVIEW_BOTS = [
  "facebookexternalhit",
  "Facebot",
  "FacebookBot",
  "Meta-ExternalAgent",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "Slackbot",
  "Discordbot",
];

/**
 * AI / generative-engine crawlers we explicitly welcome.
 * Keeping them in one list makes opt-out easy: flip the rule to disallow.
 */
const AI_BOTS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "anthropic-ai",
  "Claude-Web",
  "ClaudeBot",
  // Google AI
  "Google-Extended",
  // Perplexity
  "PerplexityBot",
  // Common Crawl
  "CCBot",
  // Apple
  "Applebot",
  "Applebot-Extended",
  // ByteDance / TikTok
  "Bytespider",
  // You.com
  "YouBot",
  // Diffbot
  "Diffbot",
  // Mistral
  "MistralAI-User",
];

function allowPublicPaths(userAgent: string) {
  return {
    userAgent,
    allow: "/",
    disallow: PRIVATE_PATHS,
  };
}

/** Meta link-preview bots — allow homepage only, no Disallow (Meta parser is picky). */
function allowMetaPreviewBot(userAgent: string) {
  return {
    userAgent,
    allow: ["/", "/opengraph-image"],
  };
}

export default function robots(): MetadataRoute.Robots {
  const siteHost = (() => {
    try {
      return new URL(BASE_URL).host;
    } catch {
      return undefined;
    }
  })();

  return {
    rules: [
      // Meta / WhatsApp first — must not include Disallow for these agents
      ...SOCIAL_PREVIEW_BOTS.map(allowMetaPreviewBot),
      // Default rule (Googlebot, Bingbot, etc.)
      allowPublicPaths("*"),
      // Other named AI crawlers
      ...AI_BOTS.map(allowPublicPaths),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    // Host must be a hostname only (not https://…); full URLs confuse some parsers
    ...(siteHost ? { host: siteHost } : {}),
  };
}
