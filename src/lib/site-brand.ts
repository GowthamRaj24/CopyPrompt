/**
 * Public site branding — safe to import from client and server components.
 */
export const SITE_BRAND = {
  /** Short slug / PWA name */
  name: "My Copyprompt",
  /** Human-readable name in navbar, footer, auth */
  displayName: "My Copyprompt",
  /** Transparent stacked-card mark (navbar, favicon source) */
  logoSrc: "/logo_transparent.png",
  domain: "mycopyprompt.in",
  contactEmail: "hello@mycopyprompt.in",
  tagline: "The fastest way to find AI prompts",
  defaultTitle: "My Copyprompt",
  titleTemplate: "%s · My Copyprompt",
  ogImageAlt: "My Copyprompt — free AI prompts for every tool",
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
