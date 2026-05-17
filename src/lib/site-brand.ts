/**
 * Public site branding — safe to import from client and server components.
 */
export const SITE_BRAND = {
  name: "mycopyprompt",
  domain: "mycopyprompt.in",
  contactEmail: "hello@mycopyprompt.in",
  tagline: "The fastest way to find AI prompts",
  defaultTitle: "mycopyprompt — The fastest way to find AI prompts",
  titleTemplate: "%s · mycopyprompt",
  ogImageAlt: "mycopyprompt — free AI prompts for every tool",
  description:
    "Search, copy and paste curated AI prompts for ChatGPT, Claude, Midjourney, Flux, Gemini and every major AI tool. Free forever.",
} as const;

export function getSiteHostname(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) return SITE_BRAND.domain;
  try {
    return new URL(url).hostname;
  } catch {
    return SITE_BRAND.domain;
  }
}
