"use client";

import {
  ArrowRightIcon,
  ChevronDownIcon,
  SparklesIcon,
  WandIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GeneratorCore } from "@/components/generate/GeneratorCore";

/**
 * Inline generator on the `/search` page.
 *
 * Replaces the previous "Generate your own → /generate redirect" with
 * an in-place experience: clicking the callout expands the same area
 * into the generator UI without navigating away from the search
 * results. The user can collapse it back, retry, or keep browsing.
 *
 * Three states the component handles:
 *
 *   1. Signed out  → shows a "Sign in to generate" CTA that deep-links
 *      to /signin?next=/search?... so the user lands back here.
 *   2. Signed in, collapsed → shows the marketing card (variant banner)
 *      or always-expanded card (variant empty-state).
 *   3. Signed in, expanded → renders <GeneratorCore /> inline.
 *
 * The empty-state variant skips state #2 — when search returned no
 * results, the user clearly wants help, so we open the generator
 * immediately and seed it with their failed query.
 */

interface InlineGeneratorProps {
  /** Failed search query — used to pre-fill the generator. */
  query: string;
  /**
   * Server-side per-day quota for the current user. `null` = not
   * signed in; `-1` = unlimited; otherwise a non-negative integer.
   */
  quotaRemaining: number | null;
  /** Visual variant + default-open behaviour. */
  variant: "banner" | "empty-state";
  /** Path to return to after signing in (e.g. current search URL). */
  signInReturnPath: string;
}

export function InlineGenerator({
  query,
  quotaRemaining,
  variant,
  signInReturnPath,
}: InlineGeneratorProps) {
  // Empty-state opens immediately; banner waits for a click.
  const [open, setOpen] = useState(variant === "empty-state");

  // Smooth-scroll the expanded generator into view on open. We do
  // this on the next frame so the layout has settled before scrolling.
  useEffect(() => {
    if (!open || variant !== "banner") return;
    requestAnimationFrame(() => {
      const el = document.getElementById("inline-generator-surface");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [open, variant]);

  // ── Signed-out fallback ─────────────────────────────────
  if (quotaRemaining === null) {
    return <SignedOutCta variant={variant} signInReturnPath={signInReturnPath} />;
  }

  // ── Signed-in, banner variant, COLLAPSED ────────────────
  if (variant === "banner" && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group/cta reveal relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/[0.07] via-primary/[0.04] to-transparent px-4 py-3 text-left transition-all hover:border-primary/45 hover:from-primary/[0.11] sm:gap-4 sm:px-5"
        aria-expanded={false}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-8 size-32 rounded-full bg-primary/12 blur-3xl"
        />
        <div className="relative grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
          <WandIcon className="size-[15px]" strokeWidth={2} />
        </div>
        <div className="relative min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold tracking-[-0.005em]">
            Can&apos;t find the perfect prompt?
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              <SparklesIcon className="size-2" strokeWidth={2.5} />
              New
            </span>
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Generate your own with AI — right here, no redirect.
          </p>
        </div>
        <span className="relative inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground shadow-soft transition-transform group-hover/cta:translate-x-0.5">
          Open
          <ChevronDownIcon className="size-3" strokeWidth={2.4} />
        </span>
      </button>
    );
  }

  // ── Signed-in, EXPANDED ─────────────────────────────────
  return (
    <div
      id="inline-generator-surface"
      className="reveal relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.06] via-card/40 to-card/30 p-4 sm:p-5"
    >
      {/* Soft glow corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3 pb-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-1 inline-flex items-center gap-1.5">
            <WandIcon className="size-3" strokeWidth={2.4} />
            AI prompt generator
          </p>
          <h3 className="text-[15px] font-bold tracking-[-0.01em] md:text-[17px]">
            {variant === "empty-state"
              ? "Let's write one for you"
              : "Generate your own"}
          </h3>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {variant === "empty-state" && query
              ? `We'll tailor a prompt around "${query}" — refine the description below if you'd like.`
              : "Pre-filled with your search. Edit if you'd like, then hit Generate."}
          </p>
        </div>
        {variant === "banner" && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close generator"
            className="press grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      <GeneratorCore
        initialQuotaRemaining={quotaRemaining}
        initialDescription={query}
        variant="compact"
        examples={[]}
        showResultReset={true}
      />
    </div>
  );
}

/* ─── Signed-out variant ─────────────────────────────────── */

function SignedOutCta({
  variant,
  signInReturnPath,
}: {
  variant: "banner" | "empty-state";
  signInReturnPath: string;
}) {
  const href = `/signin?next=${encodeURIComponent(signInReturnPath)}`;
  if (variant === "empty-state") {
    return (
      <Link
        href={href}
        className="group/cta relative block overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent p-6 transition-all hover:border-primary/50 hover:from-primary/[0.12] sm:p-8"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <WandIcon className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold tracking-[-0.01em] md:text-[17px]">
              Sign in to generate your own
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Free account → generate a production-ready prompt tailored to
              your exact use case. Takes one click.
            </p>
          </div>
          <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-soft transition-transform group-hover/cta:translate-x-0.5">
            Sign in
            <ArrowRightIcon className="size-3.5" strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="group/cta reveal relative flex items-center gap-3 overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/[0.07] via-primary/[0.04] to-transparent px-4 py-3 transition-all hover:border-primary/45 hover:from-primary/[0.11] sm:gap-4 sm:px-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-8 size-32 rounded-full bg-primary/12 blur-3xl"
      />
      <div className="relative grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
        <WandIcon className="size-[15px]" strokeWidth={2} />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="text-[13px] font-semibold tracking-[-0.005em]">
          Can&apos;t find what you need? Sign in & generate one.
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Free account, free generations.
        </p>
      </div>
      <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground shadow-soft group-hover/cta:translate-x-0.5">
        Sign in
        <ArrowRightIcon className="size-3" strokeWidth={2.4} />
      </span>
    </Link>
  );
}
