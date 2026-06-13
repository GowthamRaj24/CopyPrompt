/**
 * Typed JSON-LD builders for Schema.org structured data.
 *
 * Why structured data matters
 * ───────────────────────────
 * SEO  : Google uses Schema.org to power rich results (star ratings,
 *        breadcrumbs, sitelinks search box, FAQ accordions in SERPs).
 *
 * GEO  : Generative engines (ChatGPT browse, Perplexity, Bing Chat,
 *        Google AI Overviews) parse JSON-LD to extract citable facts
 *        and decide which sources to attribute.
 *
 * AEO  : Answer engines and voice assistants prefer FAQPage and HowTo
 *        schemas — they're the easiest to map to a direct answer.
 *
 * Conventions
 * ───────────
 *   - Every builder returns a plain JSON object (not stringified)
 *   - `@context` and `@type` are always set
 *   - Optional fields are omitted (not set to null/undefined) so the
 *     resulting JSON is minimal and validation-clean
 *   - URLs are absolutized with `abs()` so they're crawlable
 */

import { SITE_BRAND } from "@/lib/site-brand";

const SITE_NAME = SITE_BRAND.name;
const SITE_LEGAL_NAME = SITE_BRAND.name;
const SITE_TAGLINE =
  "The fastest way to find AI prompts. Free, curated, copy-paste ready.";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Convert a path or absolute URL into an absolute URL. */
export function abs(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getSiteUrl();
  if (pathOrUrl.startsWith("/")) return `${base}${pathOrUrl}`;
  return `${base}/${pathOrUrl}`;
}

/* ════════════════════════════════════════════════════════════════
   Site-wide schemas
   ════════════════════════════════════════════════════════════════ */

/**
 * Organization — site identity. Helps engines tie all pages back to a
 * single publisher and shows the logo + sameAs links in knowledge panels.
 */
export function organizationJsonLd(opts?: { sameAs?: string[] }) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: base,
    description: SITE_TAGLINE,
    logo: {
      "@type": "ImageObject",
      url: abs("/logo.png"),
      width: 512,
      height: 512,
    },
    sameAs: opts?.sameAs ?? [],
  };
}

/**
 * WebSite — used for the Sitelinks Search Box in Google SERPs.
 * The `potentialAction` lets engines surface the in-site search.
 */
export function webSiteJsonLd() {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: SITE_NAME,
    url: base,
    description: SITE_TAGLINE,
    publisher: { "@id": `${base}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * SoftwareApplication / WebApplication — the single most important
 * schema for AI engines answering "what does this app do?"
 *
 * Why
 * ───
 * When ChatGPT browse / Claude with vision / Perplexity / Gemini fetch
 * a homepage to answer a generic question about the product, they look
 * for `SoftwareApplication` or `WebApplication` JSON-LD as the
 * canonical machine-readable feature inventory. Without it, the engine
 * has to guess from the visible HTML headlines — and as the user
 * discovered, guesses are usually outdated or wrong.
 *
 * What goes here
 * ──────────────
 * - `featureList` — the actual shipped features (not roadmap items).
 * - `applicationCategory` — keeps engines from mis-classifying us.
 * - `aggregateRating` — placeholder for future review aggregation.
 * - `offers` — explicit "free" signal so engines stop saying paywall.
 *
 * Update this list as features ship — it's the AI-facing changelog.
 */
export function softwareApplicationJsonLd() {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${base}/#webapp`,
    name: SITE_NAME,
    alternateName: "MyCopyPrompt",
    url: base,
    description:
      "A free AI prompt generator + curated prompt library. Describe your goal in plain English and our generator (powered by Google Gemini 2.5 Flash) writes a production-ready prompt in seconds — or search 297+ human-reviewed prompts for ChatGPT, Claude, Gemini, Midjourney, Flux, DALL-E, Stable Diffusion and 20+ other AI tools. Built-in save / collection / favorite / remix / one-click open-in-model.",
    applicationCategory: "ProductivityApplication",
    applicationSubCategory: "AI Prompt Generator and Library",
    operatingSystem: "Web (any modern browser)",
    inLanguage: "en",
    isAccessibleForFree: true,
    publisher: { "@id": `${base}/#organization` },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Place", name: "Worldwide" },
    },
    audience: {
      "@type": "Audience",
      audienceType:
        "Anyone using generative AI tools — casual users, builders, marketers, engineers, designers, students.",
    },
    featureList: [
      // AI prompt generation (headline feature)
      "AI prompt generator — describe your goal in plain English and get a production-ready prompt back in seconds, powered by Google Gemini 2.5 Flash",
      "Generated prompts include a title, recommended target AI model, category tag, and short usage tips — not just raw text",
      "Structured JSON schema output guarantees the same predictable shape every time (no parsing failures, no broken responses)",
      "Free daily quota per signed-in user, with separate generous quotas for premium accounts and per-minute rate limits to keep the generator fast under load",
      "Privacy-first abuse handling — request IPs are salted and hashed before storage; raw IPs are never persisted",
      "Every generation is audit-logged (success and failure) so the platform can keep results high-quality over time",
      // Discovery
      "Full-text search across 297+ curated prompts",
      "Semantic search via vector embeddings",
      "Filter by AI model (27 supported) and category (16 top-level)",
      "Trending, just-added, most-viewed, and top-rated rails on the homepage",
      "Programmatic per-model, per-category, and per-tag indexable pages",
      // Per-prompt
      "One-click copy with built-in 'open in ChatGPT / Claude / Gemini / Mistral / Pi / Perplexity' deep links",
      "Sample expected output included with every text prompt",
      "Reference images + negative prompts + parameters for every image prompt",
      "Curator notes and usage tips on each prompt",
      "Aggregate copy count, view count, and thumbs-up/down rating per prompt",
      "Similar-prompt recommendations via semantic search",
      // Accounts
      "Free account with email + Google sign-in",
      "Public creator profiles at /u/<handle> with bio, stats, and contributor badges",
      "Favorites (heart any prompt)",
      "Collections — private or public boards, sharable at /c/<slug>",
      "Personal copy history (last 30 days)",
      "Saved searches with daily email digests of new matching prompts",
      // Creator economy
      "Public contributor leaderboard ranked by total copies received",
      "Prompt remix — fork any prompt with permanent attribution chain back to the original author",
      "Submit prompts publicly (admin reviewed within 24h) or privately (instant unlisted share URL)",
      // Sharing
      "Per-route social share cards (Open Graph + Twitter Large Card) generated at request time",
      "Web Share API with marketing blurb above the URL on supported platforms",
      // PWA + offline
      "Installable PWA with offline caching of prompt-detail pages",
      "Push install prompt for return visitors; iOS Add-to-Home-Screen hint",
      // Transactional
      "Welcome email on first sign-in; submission approved / rejected emails; saved-search digests",
    ],
    keywords: [
      "AI prompt generator",
      "free AI prompt generator",
      "ChatGPT prompt generator",
      "Claude prompt generator",
      "Midjourney prompt generator",
      "Gemini prompt generator",
      "prompt writer",
      "prompt builder",
      "prompt engineering tool",
      "AI prompts",
      "ChatGPT prompts",
      "Claude prompts",
      "Midjourney prompts",
      "Flux prompts",
      "Gemini prompts",
      "DALL-E prompts",
      "Stable Diffusion prompts",
      "free AI prompts",
      "prompt library",
      "prompt engineering",
      "copy paste prompts",
      "prompt sharing",
      "prompt collections",
      "prompt remix",
    ].join(", "),
    softwareVersion: "1.0",
    softwareHelp: { "@type": "CreativeWork", url: abs("/about") },
    // Citation hints for AI engines that look for documentation
    sameAs: [],
    mainEntityOfPage: base,
  };
}

/* ════════════════════════════════════════════════════════════════
   Page-level schemas
   ════════════════════════════════════════════════════════════════ */

/**
 * BreadcrumbList — appears as the trail under SERP titles.
 * Pass the visible breadcrumb segments in order.
 */
export function breadcrumbListJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}

/**
 * CreativeWork — the canonical schema for a "thing that was created".
 * We use it for individual prompts. AI engines treat CreativeWork as a
 * citable artifact and surface its author / aggregateRating / dates.
 */
export interface PromptJsonLdInput {
  url: string;
  name: string;
  description: string;
  /** The actual prompt text. */
  text: string;
  /** Image URLs if any. */
  images?: string[];
  /** Topic / category name */
  about: string;
  /** Tags/keywords */
  keywords?: string[];
  /** ISO timestamp of creation */
  datePublished: string;
  /** ISO timestamp of last update */
  dateModified?: string;
  /** Display name of the submitter / curator */
  authorName?: string;
  /** What AI model this prompt targets (e.g. "GPT-4", "Midjourney") */
  targetModel?: string;
  /** Aggregate rating from upvotes/downvotes */
  rating?: {
    upvotes: number;
    downvotes: number;
  };
  /** Number of times the prompt has been copied (proxy for "views") */
  copyCount?: number;
}

export function promptCreativeWorkJsonLd(input: PromptJsonLdInput) {
  const base = getSiteUrl();
  // CreativeWork covers prompts well; subtype "TechArticle" sometimes
  // surfaces better in dev-flavored SERPs, but CreativeWork is safer
  // for AI engines that aren't sure how to categorize a prompt.
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${abs(input.url)}#prompt`,
    name: input.name,
    headline: input.name,
    description: input.description,
    text: input.text,
    url: abs(input.url),
    inLanguage: "en",
    isAccessibleForFree: true,
    isFamilyFriendly: true,
    license: abs("/terms"),
    about: input.about,
    datePublished: input.datePublished,
    publisher: { "@id": `${base}/#organization` },
    mainEntityOfPage: abs(input.url),
  };

  if (input.dateModified) node.dateModified = input.dateModified;
  if (input.images && input.images.length > 0) {
    node.image = input.images.map((url) => abs(url));
  }
  if (input.keywords && input.keywords.length > 0) {
    node.keywords = input.keywords.join(", ");
  }
  if (input.authorName) {
    node.author = { "@type": "Person", name: input.authorName };
  } else {
    node.author = { "@id": `${base}/#organization` };
  }
  if (input.targetModel) {
    // Schema.org doesn't have a "targetModel" property, but we can use
    // a custom keyword and the description prefix to convey it.
    node.audience = {
      "@type": "Audience",
      audienceType: `Users of ${input.targetModel}`,
    };
  }
  if (
    input.rating &&
    input.rating.upvotes + input.rating.downvotes >= 1
  ) {
    const total = input.rating.upvotes + input.rating.downvotes;
    // Map +/- votes onto a 1..5 scale. 100% upvotes → 5.0.
    const ratio = input.rating.upvotes / total;
    const value = (1 + ratio * 4).toFixed(2);
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: value,
      bestRating: "5",
      worstRating: "1",
      ratingCount: total,
    };
  }
  if (input.copyCount && input.copyCount > 0) {
    node.interactionStatistic = {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CopyAction",
      userInteractionCount: input.copyCount,
    };
  }

  return node;
}

/**
 * HowTo — step-by-step instructions to use the prompt.
 * Voice assistants and Google's "How to" rich result both consume this.
 */
export function howToUsePromptJsonLd(opts: {
  promptUrl: string;
  promptTitle: string;
  modelName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use the ${opts.promptTitle} prompt`,
    description: `Step-by-step instructions for using this prompt with ${opts.modelName}.`,
    totalTime: "PT2M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Copy the prompt",
        text: `Click the Copy button on the prompt page to copy the full text to your clipboard.`,
        url: `${abs(opts.promptUrl)}#copy`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: `Open ${opts.modelName}`,
        text: `Open ${opts.modelName} in your browser or app, and start a new conversation.`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Paste and customize",
        text: `Paste the prompt. Replace any {placeholders} with your specifics before sending.`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Iterate",
        text: `If the first output isn't right, ask follow-up questions or tweak the variables — most prompts need 1-2 iterations.`,
      },
    ],
  };
}

/**
 * FAQPage — the highest-leverage schema for AEO.
 * Engines like Google and Perplexity often pull verbatim answers from
 * FAQPage entries into featured snippets and AI Overviews.
 */
export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/**
 * ItemList — for grids of prompts (homepage trending, category, search).
 * Helps engines understand the page is a curated list, not a single item.
 */
export function itemListJsonLd(
  items: Array<{ name: string; url: string }>,
  opts?: { name?: string; description?: string },
) {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: abs(item.url),
      name: item.name,
    })),
    numberOfItems: items.length,
  };
  if (opts?.name) node.name = opts.name;
  if (opts?.description) node.description = opts.description;
  return node;
}

/**
 * CollectionPage — wraps a category / search results page as a curated
 * collection. Combine with ItemList for category pages.
 */
export function collectionPageJsonLd(opts: {
  url: string;
  name: string;
  description: string;
  itemList: ReturnType<typeof itemListJsonLd>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${abs(opts.url)}#collection`,
    url: abs(opts.url),
    name: opts.name,
    description: opts.description,
    mainEntity: opts.itemList,
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
  };
}

/**
 * Article — editorial guides and long-form content pages.
 */
export function articleJsonLd(opts: {
  url: string;
  headline: string;
  description: string;
  datePublished: string;
}) {
  const pageUrl = abs(opts.url);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    url: pageUrl,
    headline: opts.headline,
    description: opts.description,
    datePublished: opts.datePublished,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: abs("/logo.png"),
      },
    },
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
  };
}
