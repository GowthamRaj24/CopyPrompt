import {
  CheckIcon,
  ChevronRightIcon,
  ImageIcon,
  MessageSquareIcon,
  RefreshCwIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown/Markdown";
import { HeartButton } from "@/components/prompt/HeartButton";
import { PromptCard } from "@/components/prompt/PromptCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatRelativeTime } from "@/lib/format";
import {
  breadcrumbListJsonLd,
  promptCreativeWorkJsonLd,
} from "@/lib/seo/jsonld";
import {
  type PromptDetail,
  getPromptBySlug,
  getSimilarPrompts,
} from "@/server/services/prompt.service";
import { ActionsBar } from "./components/ActionsBar";
import { CopyButton } from "./components/CopyButton";
import { ImageStack } from "./components/ImageStack";
import { ParametersList } from "./components/ParametersList";
import { ViewBeacon } from "./components/ViewBeacon";

/**
 * ISR: cached at the CDN and regenerated at most every 5 minutes, so the
 * copy/view/save counts shown can be up to 5 minutes stale. Views are
 * counted by the client-side `ViewBeacon` (the render no longer runs per
 * visit). Per-user state (heart + rating) is hydrated client-side, so the
 * page never needs to know who the visitor is.
 */
export const revalidate = 300;

/**
 * Empty list = render each path on its first visit, then serve it from the
 * ISR cache (regenerated per `revalidate`). Without this, Next renders the
 * route dynamically on every request.
 */
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug);
  if (!prompt) return { title: "Prompt not found" };

  // SEO description: prefer the curator's note if present, otherwise
  // derive from the prompt body. Engines and AI crawlers use this both
  // for SERP snippets AND as a quotable summary in AI Overviews.
  const desc = prompt.tips
    ? truncate(prompt.tips, 160)
    : `${prompt.model.name} prompt: ${truncate(prompt.promptText, 140)}`;

  const title = `${prompt.title} — ${prompt.model.name} prompt`;

  return {
    title,
    description: desc,
    keywords: [
      prompt.title,
      `${prompt.model.name} prompt`,
      `${prompt.category.name} prompt`,
      `${prompt.model.type} prompt`,
      "free AI prompt",
      "copy paste prompt",
    ],
    authors: [{ name: "mycopyprompt" }],
    openGraph: {
      title,
      description: desc,
      // We intentionally do NOT specify `images` here — the file-based
      // `opengraph-image.tsx` sibling auto-generates a branded card per
      // prompt and Next.js injects the correct `<meta property="og:image">`
      // tags for us. Setting `images` manually would override it.
      type: "article",
      publishedTime: prompt.createdAt.toISOString(),
      tags: [prompt.category.name, prompt.model.name, prompt.model.type],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      // Same as above: `twitter-image.tsx` sibling handles the image.
    },
    alternates: { canonical: `/prompt/${prompt.slug}` },
  };
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const prompt = await getPromptBySlug(slug);
  if (!prompt) notFound();

  // Find similar prompts using full-text search on the title (with a
  // same-category top-up when FTS returns less than the requested 6).
  // Smarter than the old "same category" rule because it surfaces
  // semantically-adjacent prompts even when they live elsewhere — e.g.
  // a Midjourney cyberpunk portrait will discover a Flux cyberpunk
  // portrait across category boundaries.
  const related = await getSimilarPrompts(
    prompt.id,
    prompt.title,
    prompt.category.id,
    prompt.model.type,
    6,
  );

  const isImage = prompt.model.type === "image";
  // Placeholder stock photos are filtered out in the service layer, so
  // `images` only ever holds real, author-supplied sample outputs.
  const hasSampleImages = isImage && prompt.images.length > 0;
  const wordCount = prompt.promptText.split(/\s+/).filter(Boolean).length;
  const aspect = prompt.params.aspect_ratio
    ? String(prompt.params.aspect_ratio)
    : null;

  /* ── Structured data: breadcrumb + the prompt itself. We deliberately
        don't emit FAQPage / HowTo here — the generic per-prompt FAQ was
        identical boilerplate on every page (a low-value-content signal),
        and Google no longer shows those rich results for sites like this. */
  const jsonLd = [
    breadcrumbListJsonLd([
      { name: "Home", url: "/" },
      {
        name: isImage ? "Image prompts" : "Text prompts",
        url: `/search?type=${prompt.model.type}`,
      },
      {
        name: prompt.category.name,
        url: `/category/${prompt.category.slug}`,
      },
      { name: prompt.title, url: `/prompt/${prompt.slug}` },
    ]),
    promptCreativeWorkJsonLd({
      url: `/prompt/${prompt.slug}`,
      name: prompt.title,
      description: prompt.tips ?? truncate(prompt.promptText, 200),
      text: prompt.promptText,
      images: prompt.images.map((i) => i.cdnUrl),
      about: prompt.category.name,
      keywords: [
        prompt.model.name,
        prompt.category.name,
        prompt.model.type,
        "AI prompt",
      ],
      datePublished: prompt.createdAt.toISOString(),
      targetModel: prompt.model.name,
      rating: {
        upvotes: prompt.upvotes,
        downvotes: prompt.downvotes,
      },
      copyCount: prompt.copyCount,
    }),
  ];

  return (
    <article className="relative">
      {/* Server-rendered structured data — emitted into initial HTML so
          AI engines and crawlers see it on first byte. */}
      <JsonLd data={jsonLd} />
      <ViewBeacon promptId={prompt.id} />

      {/* Subtle ambient background */}
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
      />

      <div className="container relative mx-auto px-4 py-5 sm:px-6 md:py-8">
        {/* Breadcrumb */}
      <nav
        className="reveal mb-5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <ChevronRightIcon className="size-2.5 text-muted-foreground/30" aria-hidden />
        <Link
          href={`/search?type=${prompt.model.type}`}
          className="transition-colors hover:text-foreground"
        >
          {isImage ? "Image" : "Text"}
        </Link>
        <ChevronRightIcon className="size-2.5 text-muted-foreground/30" aria-hidden />
        <Link
          href={`/category/${prompt.category.slug}`}
          className="transition-colors hover:text-foreground"
        >
          {prompt.category.name}
        </Link>
      </nav>

      {/* TWO-COLUMN — visual (5/12) + info (7/12) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* LEFT — Visual evidence */}
        <div className="reveal delay-1 lg:col-span-5">
          {hasSampleImages ? (
            <ImageStack images={prompt.images} title={prompt.title} />
          ) : (
            <PromptShowcase prompt={prompt} />
          )}
        </div>

        {/* RIGHT — Info */}
        <div className="reveal delay-2 lg:col-span-7">
          {/* Top: badge + heart */}
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/models/${prompt.model.slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              {isImage ? (
                <ImageIcon className="size-3" />
              ) : (
                <MessageSquareIcon className="size-3" />
              )}
              {prompt.model.name}
            </Link>
            <HeartButton
              promptId={prompt.id}
              className="press grid size-9 place-items-center rounded-lg border border-border/50 bg-card/60 text-muted-foreground transition-all hover:border-border hover:bg-card hover:text-foreground"
            />
          </div>

          {/* Title */}
          <h1 className="mt-3 text-2xl font-bold leading-[1.08] tracking-[-0.035em] text-balance md:text-3xl lg:text-[2.5rem]">
            {prompt.title}
          </h1>

          {/* Meta line */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
            <Link
              href={`/category/${prompt.category.slug}`}
              className="font-medium transition-colors hover:text-foreground"
            >
              {prompt.category.name}
            </Link>
            <span aria-hidden className="text-muted-foreground/25">
              ·
            </span>
            <span>{formatRelativeTime(prompt.createdAt)}</span>
            {prompt.author && (
              <>
                <span aria-hidden className="text-muted-foreground/25">
                  ·
                </span>
                <span>
                  by{" "}
                  <Link
                    href={`/u/${prompt.author.handle}`}
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {prompt.author.fullName ?? `@${prompt.author.handle}`}
                  </Link>
                </span>
              </>
            )}
          </div>

          {(prompt.remixSource || prompt.remixCount > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <RefreshCwIcon
                className="size-3 text-primary/60"
                strokeWidth={2}
                aria-hidden
              />
              {prompt.remixSource && (
                <>
                  <span>Remixed from</span>
                  <Link
                    href={`/prompt/${prompt.remixSource.slug}`}
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {prompt.remixSource.title}
                  </Link>
                </>
              )}
              {prompt.remixSource && prompt.remixCount > 0 && (
                <span aria-hidden className="text-muted-foreground/25">
                  ·
                </span>
              )}
              {prompt.remixCount > 0 && (
                <Link
                  href={`/prompt/${prompt.slug}/remixes`}
                  className="font-medium text-foreground transition-colors hover:text-primary"
                >
                  {prompt.remixCount}{" "}
                  {prompt.remixCount === 1 ? "remix" : "remixes"}
                </Link>
              )}
            </div>
          )}

          {/* Stats */}
          <p className="mt-4 text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {prompt.copyCount.toLocaleString()}
            </span>{" "}
            copies
            <span className="mx-1.5 text-muted-foreground/25">·</span>
            <span className="font-semibold text-foreground">
              {prompt.upvotes.toLocaleString()}
            </span>{" "}
            saves
            <span className="mx-1.5 text-muted-foreground/25">·</span>
            <span className="font-semibold text-foreground">
              {prompt.viewCount.toLocaleString()}
            </span>{" "}
            views
          </p>

          {/* Copy CTA — primary action */}
          <div className="mt-5">
            <CopyButton
              promptId={prompt.id}
              promptText={prompt.promptText}
              withParams={prompt.params}
              modelSlug={prompt.model.slug}
              modelName={prompt.model.name}
            />
          </div>

          {/* Trust pills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <TrustPill>Free forever</TrustPill>
            <TrustPill>Copy-paste ready</TrustPill>
            <TrustPill>No signup</TrustPill>
          </div>

          {/* Tech meta */}
          <p className="mt-4 font-mono text-[11px] text-muted-foreground">
            <span className="text-foreground">{wordCount}</span> words
            <span className="mx-1.5 text-muted-foreground/25">·</span>
            <span className="text-foreground">
              {prompt.promptText.length.toLocaleString()}
            </span>{" "}
            chars
            {aspect && (
              <>
                <span className="mx-1.5 text-muted-foreground/25">·</span>
                Aspect <span className="text-foreground">{aspect}</span>
              </>
            )}
          </p>

          {/* Curator note */}
          {prompt.tips && (
            <aside className="mt-5 rounded-lg border-l-2 border-primary/40 bg-card/30 px-3.5 py-2.5">
              <p className="eyebrow mb-1.5">Note from the curator</p>
              <Markdown content={prompt.tips} />
            </aside>
          )}

          {/* Divider */}
          <div className="my-6 h-px bg-border/40" />

          {/* Main display:
                Image prompts → "The Prompt" code block (the prompt is the data)
                Text prompts  → "Sample output" card (the prompt is in the left column) */}
          {hasSampleImages ? (
            <PromptCodeBlock text={prompt.promptText} maxHeight="400px" />
          ) : isImage ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-card/30 px-3.5 py-3 text-[13px] leading-relaxed text-muted-foreground">
              No sample image yet. Run this prompt in {prompt.model.name} and
              your result will follow the description above — results vary
              with the random seed and settings.
            </p>
          ) : (
            prompt.expectedOutcome && (
              <SampleOutputCard
                content={prompt.expectedOutcome}
                modelName={prompt.model.name}
              />
            )
          )}

          {/* Negative prompt */}
          {isImage && prompt.negativePrompt && (
            <details className="mt-2.5 rounded-lg border border-border/50 bg-card/30 px-3.5 py-2.5 transition-colors hover:border-border">
              <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground hover:text-foreground">
                Negative prompt
              </summary>
              <pre className="mt-2.5 font-mono text-[11px] leading-[1.7] whitespace-pre-wrap text-muted-foreground">
                {prompt.negativePrompt}
              </pre>
            </details>
          )}

          {/* Parameters */}
          <div className="mt-5 rounded-xl border border-border/50 bg-card/30 p-4">
            <p className="eyebrow mb-2.5">Parameters</p>
            <ParametersList
              params={prompt.params}
              modelType={prompt.model.type}
            />
          </div>

          {/* Bottom action row */}
          <div className="mt-6 border-t border-border/40 pt-4">
            <ActionsBar
              promptId={prompt.id}
              promptSlug={prompt.slug}
              promptTitle={prompt.title}
              modelName={prompt.model.name}
              modelType={prompt.model.type}
            />
          </div>
        </div>
      </div>

      {/* SIMILAR — full-text-search matched on the prompt title.
          Falls back to same-category when FTS finds fewer than 6
          results (handled inside `getSimilarPrompts`). */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-border/40 pt-10 md:mt-24 md:pt-14">
          <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <div>
              <p className="eyebrow mb-1">Similar prompts</p>
              <h2 className="text-xl font-bold tracking-[-0.03em] md:text-2xl">
                You might also like
              </h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Matched against every prompt in the catalog by title.
              </p>
            </div>
            <Link
              href={`/search?q=${encodeURIComponent(prompt.title)}`}
              className="link-underline shrink-0 text-[13px] font-medium"
            >
              More like this →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, idx) => (
              <PromptCard
                key={p.id}
                prompt={p}
                index={idx + 1}
                unoptimizedImage={
                  p.primaryImage?.cdnUrl.includes("picsum.photos") ?? false
                }
              />
            ))}
          </div>
        </section>
      )}
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

/**
 * Left-column "The Prompt" showcase (text prompts only).
 * Sticky on lg so it stays in view while reading the right column.
 */
function PromptShowcase({ prompt }: { prompt: PromptDetail }) {
  return (
    <div className="lg:sticky lg:top-18">
      <PromptCodeBlock text={prompt.promptText} maxHeight="560px" />
    </div>
  );
}

/**
 * The Prompt — the single most important piece of content on this page.
 *
 * Treated as the hero block: subtle primary-tinted gradient, accent
 * stripe along the top edge, a small primary indicator in the header,
 * a slim outer glow, and larger body text than surrounding chrome.
 * Cheap to render — gradient + shadow are static, no animations.
 *
 * Shared by both layouts so visual identity stays consistent whether
 * the user is on an image-type or text-type prompt detail page.
 */
function PromptCodeBlock({
  text,
  maxHeight,
}: {
  text: string;
  maxHeight: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/35 bg-gradient-to-b from-primary/[0.045] via-card/70 to-card/60 shadow-[0_1px_0_0_oklch(0.66_0.21_270_/_0.06),0_10px_30px_-12px_oklch(0.66_0.21_270_/_0.18)] dark:from-primary/[0.06] dark:via-card/40 dark:to-card/20 dark:shadow-[0_1px_0_0_oklch(0.66_0.21_270_/_0.08),0_10px_30px_-12px_oklch(0.66_0.21_270_/_0.22)]">
      {/* Top accent stripe — a 1px gradient that says "this is the star". */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-primary/20 bg-primary/[0.07] px-4 py-2.5 dark:bg-primary/[0.09]">
        <span className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_1px_oklch(0.66_0.21_270_/_0.45)]"
          />
          The Prompt
        </span>
        <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
          {text.length.toLocaleString()} chars
        </span>
      </div>

      {/* Body — slightly larger type than the surrounding chrome so the
          prompt reads as the focal point without being shouty. */}
      <pre
        className="m-0 overflow-auto border-0 bg-transparent p-4 font-mono text-[13px] leading-[1.75] whitespace-pre-wrap text-foreground md:p-5 md:text-[14px]"
        style={{ maxHeight }}
      >
        {text}
      </pre>
    </div>
  );
}

/**
 * Right-column "Sample output" card — what the AI returns when this
 * prompt is run. Only rendered when expectedOutcome exists.
 */
function SampleOutputCard({
  content,
  modelName,
}: {
  content: string;
  modelName: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/40">
      <div className="relative flex flex-col p-4 md:p-5">
        <p className="eyebrow mb-2.5">Sample output</p>
        <Markdown
          content={content}
          className="max-h-[400px] overflow-auto"
        />
        <div className="mt-4 flex items-center gap-1.5 border-t border-border/40 pt-2.5">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          <span className="text-[11px] font-medium text-muted-foreground">
            What {modelName} returns
          </span>
        </div>
      </div>
    </div>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <CheckIcon className="size-2.5 text-primary" strokeWidth={2.5} aria-hidden />
      {children}
    </span>
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}
