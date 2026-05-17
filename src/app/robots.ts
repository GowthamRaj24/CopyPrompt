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

/**
 * AI / generative-engine crawlers we explicitly welcome.
 * Keeping them in one list makes opt-out easy: flip the rule to disallow.
 */
const AI_BOTS = [
  // OpenAI
  "GPTBot", // ChatGPT training data
  "OAI-SearchBot", // ChatGPT live search index
  "ChatGPT-User", // ChatGPT user-initiated browsing (very lightweight)
  // Anthropic
  "anthropic-ai",
  "Claude-Web",
  "ClaudeBot",
  // Google AI
  "Google-Extended", // Bard / Gemini / AI Overviews opt-in
  // Perplexity
  "PerplexityBot",
  // Common Crawl (fuels many open-source LLMs)
  "CCBot",
  // Meta / WhatsApp link previews (facebookexternalhit is required for Sharing Debugger)
  "facebookexternalhit",
  "Facebot",
  "FacebookBot",
  "Meta-ExternalAgent",
  // X / LinkedIn / Slack / Discord previews
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
  // Apple
  "Applebot",
  "Applebot-Extended",
  // ByteDance / TikTok
  "Bytespider",
  // You.com
  "YouBot",
  // Diffbot (used by some AI pipelines)
  "Diffbot",
  // Mistral
  "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── 1) Default crawler rule (covers Googlebot, Bingbot, DuckDuckBot, etc.)
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },

      // ── 2) Explicit per-bot rules for AI engines. Each gets the same
      //       visibility as the default rule — we just name them so
      //       compliance is unambiguous.
      ...AI_BOTS.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
