import {
  CheckIcon,
  ChevronRightIcon,
  ImageIcon,
  MessageSquareIcon,
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
  faqJsonLd,
  howToUsePromptJsonLd,
  promptCreativeWorkJsonLd,
} from "@/lib/seo/jsonld";
import { after } from "next/server";
import { queueViewIncrement } from "@/server/lib/counter-batcher";
import {
  type PromptDetail,
  getPromptBySlug,
  getSimilarPrompts,
} from "@/server/services/prompt.service";
import { ActionsBar } from "./components/ActionsBar";
import { CopyButton } from "./components/CopyButton";
import { ImageStack } from "./components/ImageStack";
import { ParametersList } from "./components/ParametersList";

/**
 * Per-request rendering — the page still depends on live copy/view/save
 * counts and bumps `view_count` via `next/server`'s `after()` callback.
 * Per-user state (heart + rating) is hydrated client-side, so the
 * server never queries the auth table or user-specific tables here.
 */
export const dynamic = "force-dynamic";

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
    authors: [{ name: "CopyPrompt" }],
    openGraph: {
      title,
      description: desc,
      images: prompt.images[0]
        ? [
            {
              url: prompt.images[0].cdnUrl,
              width: prompt.images[0].width,
              height: prompt.images[0].height,
              alt: prompt.images[0].alt ?? prompt.title,
            },
          ]
        : undefined,
      type: "article",
      publishedTime: prompt.createdAt.toISOString(),
      tags: [prompt.category.name, prompt.model.name, prompt.model.type],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: prompt.images[0] ? [prompt.images[0].cdnUrl] : undefined,
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

  // Fire-and-forget view-count bump — pushed onto the in-memory
  // batcher, which coalesces all view increments into a single UPDATE
  // every few seconds. No DB round-trip on the hot path.
  after(() => {
    queueViewIncrement(prompt.id);
  });

  const isImage = prompt.model.type === "image";
  const usesPicsum = prompt.images.some((img) =>
    img.cdnUrl.includes("picsum.photos"),
  );
  const wordCount = prompt.promptText.split(/\s+/).filter(Boolean).length;
  const aspect = prompt.params.aspect_ratio
    ? String(prompt.params.aspect_ratio)
    : null;

  /* ── FAQ — both visible on the page AND emitted as FAQPage schema.
        Sourcing answers from the prompt itself keeps the content
        authentic to the page (no manufactured Q&A). Answer engines
        love these for direct citation. ───────────────────────── */
  const faqs = buildPromptFaqs({
    prompt,
    isImage,
    wordCount,
  });

  /* ── Structured data payload. Order doesn't matter for parsers but
        we group conceptually: identity → navigation → main entity →
        how-to → FAQ. ──────────────────────────────────────────── */
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
    howToUsePromptJsonLd({
      promptUrl: `/prompt/${prompt.slug}`,
      promptTitle: prompt.title,
      modelName: prompt.model.name,
    }),
    faqJsonLd(faqs),
  ];

  return (
    <article className="relative">
      {/* Server-rendered structured data — emitted into initial HTML so
          AI engines and crawlers see it on first byte. */}
      <JsonLd data={jsonLd} />

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
          {isImage && prompt.images.length > 0 ? (
            <ImageStack
              images={prompt.images}
              title={prompt.title}
              unoptimized={usesPicsum}
            />
          ) : (
            <PromptShowcase prompt={prompt} />
          )}
        </div>

        {/* RIGHT — Info */}
        <div className="reveal delay-2 lg:col-span-7">
          {/* Top: badge + heart */}
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {isImage ? (
                <ImageIcon className="size-3" />
              ) : (
                <MessageSquareIcon className="size-3" />
              )}
              {prompt.model.name}
            </span>
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
          </div>

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
          {isImage ? (
            <PromptCodeBlock text={prompt.promptText} maxHeight="400px" />
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
            />
          </div>
        </div>
      </div>

      {/* ── FAQ — high-leverage AEO surface. Engines like Google AI
            Overviews, Perplexity, and voice assistants frequently
            pull verbatim from FAQPage entries. Visible to humans too;
            duplicates the FAQPage JSON-LD above so search engines see
            identical content in both places. ─────────────────── */}
      <section
        aria-labelledby="faq-heading"
        className="mt-14 border-t border-border/40 pt-10 md:mt-20 md:pt-14"
      >
        <div className="mb-6 md:mb-8">
          <p className="eyebrow mb-1">FAQ</p>
          <h2
            id="faq-heading"
            className="text-xl font-bold tracking-[-0.03em] md:text-2xl"
          >
            Common questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.question}
              className="group rounded-lg border border-border/60 bg-card/30 px-4 py-3 transition-colors open:border-border hover:border-border"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13.5px] font-medium text-foreground">
                {f.question}
                <ChevronRightIcon
                  className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-open:rotate-90"
                  aria-hidden
                />
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {f.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

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

/**
 * Generate per-prompt FAQ content that's both displayed and emitted as
 * FAQPage schema.
 *
 * The answers are derived from the prompt's actual fields (no manufactured
 * data) so the FAQ stays truthful even as prompts change. Engines that
 * cross-check on-page text against JSON-LD will see exact matches.
 */
function buildPromptFaqs(opts: {
  prompt: PromptDetail;
  isImage: boolean;
  wordCount: number;
}): Array<{ question: string; answer: string }> {
  const { prompt, isImage, wordCount } = opts;
  const modelName = prompt.model.name;
  const categoryName = prompt.category.name;
  const popularity =
    prompt.copyCount > 0
      ? ` It's been copied ${prompt.copyCount.toLocaleString()} times so far.`
      : "";

  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: `What is the "${prompt.title}" prompt?`,
      answer: prompt.tips
        ? `${prompt.tips} The prompt targets ${modelName} and lives in the ${categoryName} category on CopyPrompt.`
        : `A ${categoryName.toLowerCase()} ${isImage ? "image" : "text"} prompt designed for ${modelName}. ${wordCount.toLocaleString()} words long, free to copy and use.${popularity}`,
    },
    {
      question: `What AI model is this prompt for?`,
      answer: `This prompt is written for ${modelName}. ${
        isImage
          ? `It's tuned for image generation — if you paste it into a text-only chatbot (like ChatGPT) the model will describe the scene instead of producing the image.`
          : `It's a text/chat prompt — paste it into ${modelName} (or compatible LLMs like Claude or GPT-4) to get the expected output.`
      }`,
    },
    {
      question: "How do I use this prompt?",
      answer: `1. Click the Copy button on this page to copy the full prompt. 2. Open ${modelName}. 3. Paste the prompt into a new conversation. 4. Replace any {placeholders} with your specifics, then send. Most prompts produce the right output on the first try; complex ones may need 1-2 iterations.`,
    },
    {
      question: "Is this prompt free to use?",
      answer: `Yes — every prompt on CopyPrompt is free forever. No paywall, no signup wall for browsing or copying. You can use it for personal or commercial work, just don't redistribute the entire CopyPrompt library.`,
    },
    {
      question: "Can I modify the prompt?",
      answer: `Absolutely — most prompts are templates. Look for {placeholders} (curly braces) and swap them with your own values. You can also reword sections, add constraints, or chain it with other prompts.`,
    },
  ];

  // Only add the "what does it look like" FAQ when the prompt has visual
  // proof attached — otherwise the answer would feel hollow.
  if (isImage && prompt.images.length > 0) {
    faqs.push({
      question: `What does the output look like?`,
      answer: `The top of this page shows ${prompt.images.length} reference image${prompt.images.length > 1 ? "s" : ""} produced by this exact prompt in ${modelName}. Your results will vary based on the random seed, but the style and composition should match closely.`,
    });
  } else if (!isImage && prompt.expectedOutcome) {
    faqs.push({
      question: `What kind of output does this produce?`,
      answer: `See the "Sample output" panel above — that's a real example of what ${modelName} returns when this prompt runs. Your output will vary in wording but should follow the same structure and depth.`,
    });
  }

  return faqs;
}
