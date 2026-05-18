import { SITE_BRAND } from "@/lib/site-brand";

export type UtmSource =
  | "share"
  | "copy"
  | "twitter"
  | "homepage"
  | "private_share";

export interface UtmParams {
  source: UtmSource;
  medium?: string;
  campaign?: string;
  content?: string;
}

/** Append standard UTM query params for analytics attribution. */
export function appendUtm(url: string, params: UtmParams): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", params.source);
    u.searchParams.set("utm_medium", params.medium ?? "referral");
    if (params.campaign) u.searchParams.set("utm_campaign", params.campaign);
    if (params.content) u.searchParams.set("utm_content", params.content);
    return u.toString();
  } catch {
    return url;
  }
}

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    `https://${SITE_BRAND.domain}`
  );
}

/** Shareable public prompt URL with UTM tracking. */
export function buildPromptShareUrl(
  slug: string,
  source: UtmSource = "share",
): string {
  return appendUtm(`${siteBase()}/prompt/${slug}`, {
    source,
    medium: "social",
    campaign: "prompt_share",
    content: slug,
  });
}
