import { SITE_BRAND } from "@/lib/site-brand";

export type UtmSource =
  | "share"
  | "copy"
  | "twitter"
  | "homepage"
  | "private_share";

/**
 * Marketing message composed of the human-readable text that goes
 * BEFORE the URL on WhatsApp / iMessage / Slack / X, the tracked
 * URL itself, and a `clipboard` pre-joined version for the fallback
 * path (when Web Share API isn't available).
 */
export interface PromptShareMessage {
  /** Title-y blurb shown above the link in a chat app's preview. */
  text: string;
  /** Public prompt URL with UTM params. */
  url: string;
  /** `text` and `url` joined with two newlines for clipboard paste. */
  clipboard: string;
}

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

/**
 * Compose the message a user actually shares from a prompt page.
 *
 * Why this exists
 * ───────────────
 * Before this helper the share button passed `{ title, url }` to
 * `navigator.share` and copied the bare URL to the clipboard, so a
 * WhatsApp message looked like a 200-char tracking URL with nothing
 * around it — terrible for click-through. Now every share carries a
 * 2-line title + value-prop blurb that explains, in a friend-tone,
 * what the receiver is about to open. The URL still unfurls a rich
 * OG card below the text on chat apps that support it.
 *
 * Tone
 * ────
 * Friendly, short, no exclamation marks or "Check this out!". The
 * first line is the prompt title (after a small emoji that helps the
 * message stand out in busy chats). The second line is a one-sentence
 * value prop that's brand-led but not salesy.
 *
 * Output
 * ──────
 * - `text` — used in `navigator.share({ text })`. On Android and iOS
 *   the OS inserts this above the URL in the recipient app.
 * - `url`  — used in `navigator.share({ url })` so unfurlers fetch
 *   the OG card from the canonical URL.
 * - `clipboard` — `text` + blank line + `url`. Used as the fallback
 *   when Web Share API is unavailable (most desktop browsers); pasting
 *   into a chat app still surfaces both pieces in one block.
 */
export function buildPromptShareMessage(input: {
  slug: string;
  title: string;
  modelName: string;
  modelType: "image" | "text";
}): PromptShareMessage {
  const url = buildPromptShareUrl(input.slug, "share");
  const emoji = input.modelType === "image" ? "🎨" : "🤖";
  const kind = input.modelType === "image" ? "image prompt" : "prompt";
  const text = `${emoji} ${input.title}

A free ${input.modelName} ${kind} from ${SITE_BRAND.displayName} — copy, paste, done.`;
  const clipboard = `${text}\n\n${url}`;
  return { text, url, clipboard };
}

/**
 * Variant of {@link buildPromptShareMessage} for prompts the SHARER
 * created themselves (the post-submit "share your prompt" flow at
 * `/submit/shared`). First-person framing reads more authentically
 * than the third-person "a free prompt I found" tone.
 */
export function buildOwnPromptShareMessage(input: {
  url: string;
  title: string;
  modelName?: string;
  modelType?: "image" | "text";
}): PromptShareMessage {
  const emoji = input.modelType === "image" ? "🎨" : "✍️";
  const modelClause = input.modelName
    ? ` for ${input.modelName}`
    : "";
  const text = `${emoji} ${input.title}

A prompt I built${modelClause} — live now on ${SITE_BRAND.displayName}. Copy, paste, run.`;
  const clipboard = `${text}\n\n${input.url}`;
  return { text, url: input.url, clipboard };
}
