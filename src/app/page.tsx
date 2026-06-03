import { asc, count, isNull } from "drizzle-orm";
import {
  ArrowRightIcon,
  EyeIcon,
  FlameIcon,
  LayersIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BrowseSeoSection } from "@/components/home/BrowseSeoSection";
import { HeroGenerateCta } from "@/components/home/HeroGenerateCta";
import { RecentlyCopiedRail } from "@/components/home/RecentlyCopiedRail";
import { SubmitPromptCta } from "@/components/home/SubmitPromptCta";

/**
 * The FAQ section is below the fold on every device and adds its own
 * JS chunk (IntersectionObserver + accordion state). Splitting it into
 * its own dynamic import shrinks the homepage's main bundle and lets
 * the browser parse the FAQ chunk in parallel rather than as part of
 * the initial parse-and-execute pass that dominates mobile TBT.
 * `ssr: true` keeps the FAQ HTML in the document for SEO.
 */
const HomepageFaqSection = dynamic(
  () =>
    import("@/components/home/HomepageFaqSection").then(
      (m) => m.HomepageFaqSection,
    ),
  { ssr: true },
);
import { listCuratedCollections } from "@/server/services/collection.service";
import { PromptCarousel } from "@/components/prompt/PromptCarousel";
import { HeroSearchForm } from "@/components/search/HeroSearchForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { db } from "@/server/lib/db";
import { categories } from "@/server/models/category.model";
import { publicPublishedWhere } from "@/lib/prompt-visibility";
import { prompts } from "@/server/models/prompt.model";
import { getIndexableModels } from "@/server/services/model-catalog.service";
import {
  getHomepageRails,
  type PromptListItem,
} from "@/server/services/prompt.service";
import { getIndexableTags } from "@/server/services/tag.service";

/**
 * Homepage — premium, search-first.
 *
 * Design system (used by EVERY section on this page)
 * ──────────────────────────────────────────────────
 *   Vertical rhythm   py-16 md:py-20            (64 / 80 px)
 *   Section heading   text-[1.625rem] md:text-3xl + tracking-[-0.03em]
 *   Subtitle          text-[13px] muted-foreground
 *   Eyebrow           .eyebrow + small primary icon (3-icon, gap-1.5)
 *   View-all link     text-[13px] · link-underline · ArrowRightIcon
 *   Tone alternation  every other rail uses `tone="muted"` so the
 *                     page reads as bands of plain ↔ tinted surface
 *
 * Atmospheric layers
 * ──────────────────
 *   The global atmosphere (body::before mesh + AmbientOrbs +
 *   body::after constellation) is rich on its own. Sections do NOT
 *   stack extra orbs / grids / spotlights on top — that was the cause
 *   of the previous "everything is glowing" noise. The hero keeps a
 *   single subtle bg-hero radial; everything else inherits the
 *   page background.
 *
 * Caching
 * ───────
 *   30-minute ISR + per-query `unstable_cache` with named tags.
 *   Both layers are busted by `revalidatePath("/")` (route) and
 *   `revalidateTag("home:*")` (query) in `admin.service.approveSubmission()`
 *   when content changes. Pre-Round 4 we paid ~1.3s of cold-render time
 *   on revalidation; the per-query cache lets each rail render from
 *   memory in single-digit ms.
 */
export const revalidate = 1800;

// Cached, tagged versions of the per-rail queries. The TTL on each is
// the same as the route revalidate so they expire together — but tags
// let us bust an individual rail without rebuilding the whole route.
const getCategoriesCached = unstable_cache(
  () =>
    db
      .select()
      .from(categories)
      .where(isNull(categories.parentId))
      .orderBy(asc(categories.name))
      .limit(12),
  ["home:top-categories"],
  { revalidate: 1800, tags: ["home:top-categories", "home"] },
);

const getRailsCached = unstable_cache(
  () => getHomepageRails(),
  ["home:rails"],
  { revalidate: 1800, tags: ["home:rails", "home"] },
);

const getPublishedCountCached = unstable_cache(
  () =>
    db
      .select({ c: count() })
      .from(prompts)
      .where(publicPublishedWhere()),
  ["home:published-count"],
  { revalidate: 1800, tags: ["home:count", "home"] },
);

const getIndexableModelsCached = unstable_cache(
  () => getIndexableModels(),
  ["home:indexable-models"],
  { revalidate: 1800, tags: ["home:models", "home"] },
);

const getIndexableTagsCached = unstable_cache(
  () => getIndexableTags(24),
  ["home:indexable-tags"],
  { revalidate: 1800, tags: ["home:tags", "home"] },
);

const getCuratedCollectionsCached = unstable_cache(
  () => listCuratedCollections(6),
  ["home:curated-collections"],
  { revalidate: 1800, tags: ["home:collections", "home"] },
);

const TRY_SUGGESTIONS = [
  "cinematic portrait",
  "validate startup idea",
  "code review",
  "moody landscape",
  "essay outline",
];

/**
 * Homepage FAQs — single source of truth for BOTH the JSON-LD
 * `FAQPage` schema (consumed by AI Overviews, Perplexity, ChatGPT
 * Browse, Bing answer boxes) AND the visible accordion at the bottom
 * of the page.
 *
 * Why one constant
 * ────────────────
 * If the visible answer and the schema answer drift apart, Google
 * penalizes the page for cloaking (showing engines content that
 * differs from what users see). Keeping a single source guarantees
 * they match forever.
 *
 * Authoring rules
 * ───────────────
 *   - Question is phrased exactly as a real user would type it.
 *   - Answer leads with the direct answer in the first sentence.
 *   - Answer is 1-3 sentences max — answer engines truncate longer.
 *   - No HTML / markdown — plain prose so JSON-LD stays valid.
 */
const HOMEPAGE_FAQS = [
  {
    question: "What is mycopyprompt?",
    answer:
      "mycopyprompt is a free, curated library of copy-paste-ready prompts for ChatGPT, Claude, Midjourney, Flux, Gemini and every other major AI tool. Every prompt is human-reviewed, tagged, and tested before publication.",
  },
  {
    question: "Is mycopyprompt free?",
    answer:
      "Yes — mycopyprompt is free forever. No paywall, no signup wall for browsing or copying prompts. You only need an account to save favorites or submit your own prompts.",
  },
  {
    question: "Which AI tools are supported?",
    answer:
      "mycopyprompt covers every major AI tool — ChatGPT, Claude, Gemini, GPT-4, Midjourney, DALL-E, Flux, Stable Diffusion, and more. Each prompt is labeled with the model it was designed for.",
  },
  {
    question: "How do I find the right prompt?",
    answer:
      "Use the search bar to filter by keyword, or browse by category. You can also filter by type (image vs text) and sort by popularity or recency.",
  },
  {
    question: "Can I submit my own prompt?",
    answer:
      "Yes. Sign in with email, click Submit at the top, and fill out the four-field form. Submissions are reviewed within 24 hours and you'll get an email when yours goes live.",
  },
];

/**
 * Wrap optional homepage queries so a single failure (e.g. a pending
 * migration on the deployed DB) never breaks the entire landing page.
 * Errors are logged; the section that depends on the data renders empty.
 */
async function safeHomeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[home] ${label} failed:`, err);
    return fallback;
  }
}

export default async function HomePage() {
  // Six parallel queries — each indexed and capped so total dominant
  // time is the slowest one (~25-40ms on Supabase free tier). Every
  // query is wrapped in `unstable_cache` so the route render path
  // touches the DB only on cache miss / revalidation, not on every
  // ISR cold start.
  const [
    topCategories,
    rails,
    publishedCountRows,
    indexableModels,
    indexableTags,
    curatedCollections,
  ] = await Promise.all([
    safeHomeQuery("topCategories", () => getCategoriesCached(), []),
    safeHomeQuery("rails", () => getRailsCached(), {
      trending: [],
      recent: [],
      mostViewed: [],
      topRated: [],
    } as Awaited<ReturnType<typeof getHomepageRails>>),
    safeHomeQuery("publishedCount", () => getPublishedCountCached(), [
      { c: 0 },
    ] as Array<{ c: number }>),
    safeHomeQuery("indexableModels", () => getIndexableModelsCached(), []),
    safeHomeQuery("indexableTags", () => getIndexableTagsCached(), []),
    safeHomeQuery(
      "curatedCollections",
      () => getCuratedCollectionsCached(),
      [] as Awaited<ReturnType<typeof listCuratedCollections>>,
    ),
  ]);

  const { trending, recent, mostViewed, topRated } = rails;

  const promptCount = Number(publishedCountRows[0]?.c ?? 0);

  // ── Structured data for the homepage ──────────────────────
  const homepageJsonLd = [
    itemListJsonLd(
      trending.map((t) => ({
        name: t.title,
        url: `/prompt/${t.slug}`,
      })),
      {
        name: "Trending AI prompts",
        description:
          "The most-copied prompts on mycopyprompt this week, curated across image and text AI tools.",
      },
    ),
    faqJsonLd(HOMEPAGE_FAQS),
  ];

  return (
    <>
      <JsonLd data={homepageJsonLd} />

      {/* ════════════════════════════════════════════════════
         HERO — minimal, search-dominant, instantly useful.
         Single subtle bg-hero spotlight; the global atmosphere
         (mesh + orbs + lattice) does the rest of the work.
         ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="bg-hero pointer-events-none absolute inset-0 opacity-80"
        />

        <div className="container relative mx-auto flex min-h-[58svh] flex-col items-center justify-center px-4 py-12 text-center sm:px-6 md:py-16">
          {/* Eyebrow pill — only when catalog has content */}
          {promptCount > 0 && (
            <div className="reveal inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-md">
              <SparklesIcon className="size-3 text-primary" strokeWidth={2} />
              <span className="text-foreground">
                {promptCount.toLocaleString()}
              </span>
              curated {promptCount === 1 ? "prompt" : "prompts"}
            </div>
          )}

          <h1 className="hero-enter mt-6 max-w-2xl text-balance text-[clamp(2rem,5.5vw,3.75rem)] font-bold leading-[1.04] tracking-[-0.045em] text-foreground">
            The fastest way to find{" "}
            <span className="text-gradient-flow">AI prompts.</span>
          </h1>

          <p className="reveal delay-2 mt-4 max-w-lg text-balance text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
            Search, copy, paste. Free curated prompts for ChatGPT, Claude,
            Midjourney, Flux, Gemini and every AI tool.
          </p>

          {/* HERO SEARCH */}
          <div className="reveal delay-3 mt-8 w-full max-w-xl md:mt-10">
            <HeroSearchForm placeholder="Search prompts…" />
          </div>

          {/* Hero "Generate with AI" CTA — the secondary path with the
              Gemini-style rotating gradient halo + pulsing star + text
              shimmer animations. Always visible regardless of catalog
              size since it's a flagship feature. */}
          <div className="reveal delay-3 mt-5 flex items-center justify-center gap-2 text-[12px] text-muted-foreground/80">
            <span aria-hidden className="font-mono uppercase tracking-wider">
              or
            </span>
            <HeroGenerateCta />
          </div>

          {/* Try suggestions — refined pills */}
          <div className="reveal delay-4 mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/60">
              Try
            </span>
            {TRY_SUGGESTIONS.map((suggestion) => (
              <Link
                key={suggestion}
                href={`/search?q=${encodeURIComponent(suggestion)}`}
                className="press inline-flex items-center rounded-full border border-border/50 bg-card/50 px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
         TRUST STRIP — slim, evenly-spaced row of real numbers.
         Hairline divider top + bottom anchors it visually.
         ════════════════════════════════════════════════════ */}
      <section className="border-y border-border/40 bg-card/20">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-7 gap-y-2 px-4 py-3.5 sm:px-6">
          {promptCount > 0 && (
            <>
              <TrustItem
                value={promptCount.toLocaleString()}
                label={promptCount === 1 ? "prompt" : "prompts"}
              />
              <Divider />
            </>
          )}
          {topCategories.length > 0 && (
            <>
              <TrustItem
                value={String(topCategories.length)}
                label={
                  topCategories.length === 1 ? "category" : "categories"
                }
              />
              <Divider />
            </>
          )}
          <TrustItem value="Free" label="forever" />
          <Divider />
          <TrustItem value="No" label="signup to browse" />
        </div>
      </section>

      {/* "For you" rail — only for signed-in users with copy history.
         Client-rendered so the homepage HTML stays ISR-cacheable. */}
      <RecentlyCopiedRail />

      {/* ════════════════════════════════════════════════════
         PROMPT RAILS — four sections, all using <PromptRail>
         for identical typography, padding and ornament.
         Tone alternates plain/muted/plain/muted for rhythm.
         ════════════════════════════════════════════════════ */}
      {trending.length > 0 && (
        <PromptRail
          eyebrow="This week"
          title="Trending prompts"
          subtitle="The most-copied prompts across the archive."
          icon={<FlameIcon className="size-3" />}
          viewAllHref="/search?sort=popular"
          prompts={trending}
          id="trending"
          /* First carousel — first 4 cards are above the fold on
             desktop and are the LCP candidates. Mark them priority so
             Next/Image emits `fetchpriority="high"` + eager loading. */
          priorityCount={4}
        />
      )}

      {recent.length > 0 && (
        <PromptRail
          eyebrow="Just added"
          title="Fresh from the queue"
          subtitle="The newest entries, hot off review."
          icon={<SparklesIcon className="size-3" />}
          viewAllHref="/search?sort=latest"
          prompts={recent}
          tone="muted"
        />
      )}

      {mostViewed.length > 0 && (
        <PromptRail
          eyebrow="Most viewed"
          title="People are reading these"
          subtitle="Highest view counts across the archive."
          icon={<EyeIcon className="size-3" />}
          viewAllHref="/search?sort=views"
          prompts={mostViewed}
        />
      )}

      {topRated.length > 0 && (
        <PromptRail
          eyebrow="Top rated"
          title="Community favourites"
          subtitle="Best net thumbs-up across every prompt."
          icon={<StarIcon className="size-3" />}
          viewAllHref="/search?sort=rated"
          prompts={topRated}
          tone="muted"
        />
      )}

      {/* Empty state for fresh DBs — only when EVERY rail is empty. */}
      {trending.length === 0 &&
        recent.length === 0 &&
        mostViewed.length === 0 &&
        topRated.length === 0 && (
          <section className="container mx-auto px-4 py-12 sm:px-6 md:py-16">
            <EmptyState />
          </section>
        )}

      <SubmitPromptCta />

      {/* ════════════════════════════════════════════════════
         CATEGORIES — quiet, dense grid of clickable chips.
         Same heading rhythm as the rails so nothing breaks
         the page's vertical typography pace.
         ════════════════════════════════════════════════════ */}
      <BrowseSeoSection
        models={indexableModels}
        tags={indexableTags}
        curatedCollections={curatedCollections.map((c) => ({
          slug: c.slug,
          name: c.name,
          description: c.description,
          promptCount: c.promptCount,
        }))}
      />

      {topCategories.length > 0 && (
        <section className="cv-below-fold border-t border-border/40">
          <div className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
            <SectionHeader
              eyebrow="Browse"
              eyebrowIcon={<LayersIcon className="size-3" />}
              title="Every category, every model"
              subtitle="Jump straight to what you’re building."
            />

            <div className="reveal grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-2.5 lg:grid-cols-4">
              {topCategories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="lift group flex h-11 items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/60 px-3.5 text-[13px] font-medium transition-all hover:border-primary/30 hover:bg-card"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <span className="line-clamp-1 text-foreground transition-colors group-hover:text-primary">
                    {cat.name}
                  </span>
                  <ArrowRightIcon
                    className="size-3 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/search"
                className="magnetic inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 text-[12.5px] font-medium transition-all hover:border-border hover:bg-card"
              >
                Browse every prompt
                <ArrowRightIcon className="size-3" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      )}

      <HomepageFaqSection faqs={HOMEPAGE_FAQS} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Section primitives — single source of truth so every section
   on this page renders with the exact same rhythm.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Canonical section header — eyebrow + title + subtitle + optional
 * right-aligned action. Every prompt rail and the categories section
 * use this so the page reads as one consistent typographic system.
 */
function SectionHeader({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="reveal mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4 md:mb-7">
      <div className="min-w-0">
        <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
          {eyebrowIcon}
          {eyebrow}
        </p>
        <h2 className="text-[1.375rem] font-bold leading-tight tracking-[-0.03em] md:text-[1.75rem]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * Reusable prompt-carousel section. Single primitive for ALL four
 * prompt rails (Trending, Just added, Most viewed, Top rated) so they
 * share padding, heading sizes, and ornament.
 *
 * `tone="muted"` adds a subtle `bg-card/30` band so adjacent sections
 * read as distinct without needing heavy borders.
 */
function PromptRail({
  eyebrow,
  title,
  subtitle,
  icon,
  viewAllHref,
  prompts,
  tone = "plain",
  id,
  priorityCount = 0,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  viewAllHref: string;
  prompts: PromptListItem[];
  tone?: "plain" | "muted";
  id?: string;
  priorityCount?: number;
}) {
  return (
    <section
      id={id}
      className={`cv-below-fold relative scroll-mt-20 ${
        tone === "muted" ? "border-y border-border/40 bg-card/30" : ""
      }`}
    >
      <div className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
        <SectionHeader
          eyebrow={eyebrow}
          eyebrowIcon={icon}
          title={title}
          subtitle={subtitle}
          action={
            <Link
              href={viewAllHref}
              className="link-underline group inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-foreground"
            >
              View all
              <ArrowRightIcon
                className="size-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          }
        />
        <PromptCarousel
          prompts={prompts}
          ariaLabel={title}
          priorityCount={priorityCount}
        />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tiny presentational helpers
   ═══════════════════════════════════════════════════════════════ */

function TrustItem({ value, label }: { value: string; label: string }) {
  return (
    <span className="text-[12px] text-muted-foreground">
      <span className="font-semibold text-foreground">{value}</span> {label}
    </span>
  );
}

function Divider() {
  return (
    <span
      aria-hidden
      className="hidden h-3 w-px bg-border/70 sm:inline-block"
    />
  );
}

/** Friendly catalog-empty state — never references seed scripts. */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <SparklesIcon className="size-5" strokeWidth={1.8} />
      </div>
      <p className="text-[15px] font-semibold tracking-[-0.005em]">
        The catalog is just getting started.
      </p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        We&apos;re curating the first wave of prompts. Have a great one? Be
        the first to share it.
      </p>
      <Link
        href="/submit"
        className="magnetic mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[12.5px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
      >
        Submit a prompt
        <ArrowRightIcon className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}
