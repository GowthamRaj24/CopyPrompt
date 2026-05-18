import {
  ArrowUpRightIcon,
  CopyIcon,
  FlameIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SaveToCollectionButton } from "@/components/collections/SaveToCollectionButton";
import { formatCount } from "@/lib/format";
import { HeartButton } from "./HeartButton";
import { PromptCardCopyButton } from "./PromptCardCopyButton";

export interface PromptCardData {
  id: string;
  slug: string;
  title: string;
  modelName: string;
  /** Optional — when provided, the copy toast offers a deep-link to that AI tool. */
  modelSlug?: string;
  modelType: "image" | "text";
  promptText: string;
  expectedOutcome: string | null;
  copyCount: number;
  upvotes: number;
  primaryImage: {
    cdnUrl: string;
    width: number;
    height: number;
    alt: string | null;
  } | null;
}

interface PromptCardProps {
  prompt: PromptCardData;
  /** Optional issue index for numbering */
  index?: number;
  /** Disable Next.js image optimization for picsum placeholders */
  unoptimizedImage?: boolean;
  /** Server-fetched initial favorite state */
  initialFavorited?: boolean;
}

const TRENDING_THRESHOLD = 1000;

/**
 * PromptCard — the single most important component in the app.
 *
 * Architecture:
 *   - Full-card link wraps everything
 *   - Two distinct visual modes: ImageCard and CodeCard
 *   - Premium hover: lift + border glow + shine sweep + inner glow
 *   - Floating action bar with heart + copy — stops propagation
 *   - Trending badge for popular prompts
 *   - Model badge with colored dot indicator
 *   - Copy count as social proof
 */
export function PromptCard({
  prompt,
  index,
  unoptimizedImage,
  initialFavorited,
}: PromptCardProps) {
  const isImage = prompt.modelType === "image";
  const isTrending = prompt.copyCount >= TRENDING_THRESHOLD;

  return (
    <Link
      href={`/prompt/${prompt.slug}`}
      className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 to-card/85 shadow-soft transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform hover:-translate-y-[3px] hover:border-primary/30 hover:shadow-[0_20px_40px_-12px_oklch(0.54_0.225_270_/_0.18),0_0_0_1px_oklch(0.54_0.225_270_/_0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/[0.06] dark:from-card/90 dark:to-card/70 dark:shadow-none dark:hover:border-primary/20 dark:hover:shadow-[0_20px_40px_-12px_oklch(0.66_0.21_270_/_0.20),0_0_0_1px_oklch(0.66_0.21_270_/_0.06)]"
    >
      {/* ── Shine sweep layer ── */}
      <div className="card-shine" aria-hidden />

      {/* ── Inner glow layer ── */}
      <div className="card-inner-glow" aria-hidden />

      {/* ── Visual region ── */}
      {isImage ? (
        <ImageVisual prompt={prompt} unoptimized={unoptimizedImage} />
      ) : (
        <CodeVisual prompt={prompt} />
      )}

      {/* ── Content region ── */}
      <div className="relative z-[2] flex flex-1 flex-col px-4 pt-3.5 pb-4">
        {/* Model + trending row */}
        <div className="mb-2 flex items-center gap-2">
          <ModelBadge name={prompt.modelName} type={prompt.modelType} />
          {isTrending && <TrendingBadge />}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-[14px] font-semibold leading-[1.35] tracking-[-0.015em] text-foreground transition-colors duration-200 group-hover/card:text-primary">
          {prompt.title}
        </h3>

        {/* Excerpt — image cards show prompt text, text cards already preview above */}
        {isImage && prompt.promptText && (
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/80">
            {prompt.promptText}
          </p>
        )}

        {/* Flexible spacer */}
        <div className="min-h-3 flex-1" />

        {/* ── Footer ── */}
        <div className="flex items-center gap-3 border-t border-border/30 pt-3">
          {/* Copy count */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ZapIcon
              className="size-3 text-primary/50"
              strokeWidth={2.2}
              aria-hidden
            />
            <span className="font-mono font-medium tabular-nums text-foreground/70">
              {formatCount(prompt.copyCount)}
            </span>
          </div>

          {/* Model name — truncated */}
          <span className="max-w-[80px] truncate text-[10px] text-muted-foreground/50">
            {prompt.modelName}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions — stop propagation at the button level */}
          <div className="flex items-center gap-0.5 opacity-50 transition-opacity duration-200 group-hover/card:opacity-100">
            <HeartButton
              promptId={prompt.id}
              initialFavorited={initialFavorited}
              className="press grid size-8 place-items-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-primary"
            />
            <SaveToCollectionButton promptId={prompt.id} variant="icon" />
            <PromptCardCopyButton
              promptId={prompt.id}
              promptText={prompt.promptText}
              modelSlug={prompt.modelSlug}
            />
          </div>
        </div>
      </div>

      {/* ── Open hint arrow — top right, appears on hover ── */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-3 right-3 z-10 grid size-7 place-items-center rounded-full border border-white/10 bg-black/40 text-white/70 opacity-0 backdrop-blur-xl transition-all duration-300 group-hover/card:opacity-100 group-hover/card:text-white"
      >
        <ArrowUpRightIcon className="size-3" strokeWidth={2.5} />
      </span>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   IMAGE VISUAL
   Full-bleed photo with vignette, scale-on-hover, overlay gradient
   ═══════════════════════════════════════════════════════════════ */

function ImageVisual({
  prompt,
  unoptimized,
}: {
  prompt: PromptCardData;
  unoptimized?: boolean;
}) {
  if (!prompt.primaryImage) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center bg-muted/40">
        <SparklesIcon className="size-5 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
      <Image
        src={prompt.primaryImage.cdnUrl}
        alt={prompt.primaryImage.alt ?? prompt.title}
        width={prompt.primaryImage.width}
        height={prompt.primaryImage.height}
        unoptimized={unoptimized}
        className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:scale-[1.05]"
      />

      {/* Cinematic vignette overlay */}
      <div className="card-image-overlay" aria-hidden />

      {/* Type badge — bottom-left of image region */}
      <span className="pointer-events-none absolute bottom-2.5 left-3 z-[3] inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-black/50 px-2 py-[3px] text-[10px] font-semibold tracking-wider text-white/90 uppercase backdrop-blur-xl">
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_1px_oklch(0.68_0.16_250_/_0.5)]"
        />
        Image
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CODE VISUAL
   IDE-inspired prompt preview with window chrome and line numbers
   ═══════════════════════════════════════════════════════════════ */

function CodeVisual({ prompt }: { prompt: PromptCardData }) {
  // Split prompt into lines for the line-number effect
  const lines = prompt.promptText.split("\n").slice(0, 8);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[oklch(0.13_0.008_264)]">
      {/* Accent gradient — top-right corner wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-44 rounded-full opacity-50 blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.66 0.21 270 / 0.18), transparent 70%)",
        }}
      />

      {/* Secondary accent — bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.18 220 / 0.12), transparent 70%)",
        }}
      />

      {/* Dot pattern background */}
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-0 opacity-15"
      />

      {/* Window chrome — top bar */}
      <div className="relative flex items-center gap-1.5 border-b border-white/[0.04] px-3.5 py-2">
        <span className="size-[7px] rounded-full bg-white/[0.08]" aria-hidden />
        <span className="size-[7px] rounded-full bg-white/[0.08]" aria-hidden />
        <span className="size-[7px] rounded-full bg-white/[0.08]" aria-hidden />
        <span className="ml-auto font-mono text-[9px] tracking-wider text-white/15 uppercase">
          prompt
        </span>
      </div>

      {/* Code body with line numbers */}
      <div className="relative flex-1 px-3.5 pt-2 pb-8">
        <div className="line-numbers">
          {lines.map((line, i) => (
            <span
              key={i}
              className="block truncate font-mono text-[10.5px] leading-[1.75] text-white/70"
            >
              {line || "\u00A0"}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom gradient — ensures clean fade before the type badge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[oklch(0.13_0.008_264)] via-[oklch(0.13_0.008_264_/_0.9)] to-transparent"
      />

      {/* Type badge — bottom-left, above the fade */}
      <span className="pointer-events-none absolute bottom-2.5 left-3 z-[3] inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[oklch(0.13_0.008_264_/_0.85)] px-2 py-[3px] text-[10px] font-semibold tracking-wider text-white/90 uppercase backdrop-blur-xl">
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_1px_oklch(0.7_0.18_160_/_0.5)]"
        />
        Text
      </span>

      {/* Copy icon hint — bottom-right, appears on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2.5 right-3 z-[3] grid size-6 place-items-center rounded-md border border-white/10 bg-[oklch(0.13_0.008_264_/_0.85)] text-white/50 opacity-0 backdrop-blur-xl transition-all duration-250 group-hover/card:opacity-100 group-hover/card:text-white/80"
      >
        <CopyIcon className="size-3" strokeWidth={2} />
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BADGES
   ═══════════════════════════════════════════════════════════════ */

function ModelBadge({ name, type }: { name: string; type: "image" | "text" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-[3px] text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-black/[0.05] dark:bg-muted/50 dark:ring-white/[0.04]">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${
          type === "image"
            ? "bg-blue-400/80"
            : "bg-emerald-400/80"
        }`}
      />
      <span className="max-w-[120px] truncate">{name}</span>
    </span>
  );
}

function TrendingBadge() {
  return (
    <span className="animate-badge-glow inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-[3px] text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/20">
      <FlameIcon className="size-2.5" strokeWidth={2.5} />
      Hot
    </span>
  );
}
