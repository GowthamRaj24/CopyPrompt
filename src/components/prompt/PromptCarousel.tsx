"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PromptCard } from "@/components/prompt/PromptCard";
import type { PromptListItem } from "@/server/services/prompt.service";

interface PromptCarouselProps {
  prompts: PromptListItem[];
  /** Accessibility label for the scroll region — usually mirrors the section heading. */
  ariaLabel: string;
  /**
   * Number of leading cards to mark `priority` (eager + fetchpriority="high").
   * Set on the homepage's first carousel so the LCP image isn't lazy-loaded.
   * Default 0 = all cards lazy.
   */
  priorityCount?: number;
}

/**
 * Premium horizontal prompt rail — Vercel / Linear / Stripe class.
 *
 * Visual ingredients
 * ──────────────────
 *   • Card widths step up at breakpoints (300 → 320 → 340 → 360) so
 *     desktop users always see at least 3-4 cards with one peeking.
 *   • Wide 64px gradient fades at both edges — never hard-clip a card.
 *   • Floating 40px arrow buttons with an indigo-tinted shadow, slight
 *     outside offset so they look "applied to" the carousel, not "on"
 *     the first/last card.
 *   • Slim scroll-progress pill below the rail. Subtle and only shown
 *     when there's actually overflow to navigate.
 *
 * Implementation notes
 * ────────────────────
 *   • The browser drives scroll. We only listen passively to update
 *     atStart / atEnd / scroll progress — no `preventDefault`, no
 *     custom inertia, no resize-observer math on cards.
 *   • Snap points (`snap-x snap-mandatory` + `snap-always`) make
 *     release-to-rest always land flush with a card edge.
 *   • Scroll padding (`scroll-pl-{4|6}`) keeps the first card flush
 *     with the section title.
 *   • Arrow buttons are pure CSS until the user touches them; the
 *     scroll() call is the only JS at runtime.
 */
export function PromptCarousel({
  prompts,
  ariaLabel,
  priorityCount = 0,
}: PromptCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [visibleRatio, setVisibleRatio] = useState(1); // 0..1

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth;
    setCanScroll(overflow > 4);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= overflow - 4);
    setProgress(overflow > 0 ? el.scrollLeft / overflow : 0);
    setVisibleRatio(
      el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1,
    );
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges, { passive: true });
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  const scrollBy = useCallback((direction: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll ~85% of viewport so one card carries over for context.
    const distance = el.clientWidth * 0.85 * (direction === "next" ? 1 : -1);
    el.scrollBy({ left: distance, behavior: "smooth" });
  }, []);

  // Pre-compute the progress-pill geometry. The "thumb" width is the
  // visible ratio (e.g. ~25% when 1 of 4 viewports is on screen) and
  // its left offset is the user's progress through the remaining range.
  const thumbWidthPct = Math.max(8, visibleRatio * 100);
  const thumbLeftPct = progress * (100 - thumbWidthPct);

  // Mask gradient that fades the scroll container's left/right edges
  // to transparent — clean alternative to a colored overlay div which
  // would paint over the visible card content and create a "burn" look.
  // The mask grows/shrinks based on scroll position: no fade at edges
  // the user has already reached, soft fade where more content exists.
  const fadeL = atStart ? 0 : 28;
  const fadeR = atEnd ? 0 : 48;
  const mask = `linear-gradient(to right, transparent 0, black ${fadeL}px, black calc(100% - ${fadeR}px), transparent 100%)`;

  return (
    <div className="group/carousel relative">
      {/* ── Arrow — prev ───────────────────────────────────── */}
      {canScroll && (
        <button
          type="button"
          onClick={() => scrollBy("prev")}
          disabled={atStart}
          aria-label="Scroll to previous prompts"
          className={`magnetic absolute top-1/2 left-1 z-[2] hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground shadow-[0_2px_4px_-1px_oklch(0.25_0.05_264/0.08),0_12px_28px_-6px_oklch(0.66_0.21_270/0.18)] transition-all hover:border-primary/50 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_4px_12px_-2px_oklch(0.25_0.05_264/0.12),0_20px_40px_-10px_oklch(0.66_0.21_270/0.32)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:grid lg:-left-2 xl:-left-3 ${
            atStart ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <ChevronLeftIcon className="size-[18px]" strokeWidth={2.2} />
        </button>
      )}

      {/* ── Arrow — next ──────────────────────────────────── */}
      {canScroll && (
        <button
          type="button"
          onClick={() => scrollBy("next")}
          disabled={atEnd}
          aria-label="Scroll to more prompts"
          className={`magnetic absolute top-1/2 right-1 z-[2] hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground shadow-[0_2px_4px_-1px_oklch(0.25_0.05_264/0.08),0_12px_28px_-6px_oklch(0.66_0.21_270/0.18)] transition-all hover:border-primary/50 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_4px_12px_-2px_oklch(0.25_0.05_264/0.12),0_20px_40px_-10px_oklch(0.66_0.21_270/0.32)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:grid lg:-right-2 xl:-right-3 ${
            atEnd ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <ChevronRightIcon className="size-[18px]" strokeWidth={2.2} />
        </button>
      )}

      {/* ── Scroll region ─────────────────────────────────── */}
      {/* Negative margin + padding bleeds the carousel to the container
          edge so the first card lines up with the section title and the
          last card has room to disappear into the right fade.
          Mask is applied here (not as a separate overlay div) so the
          cards genuinely fade to transparent — no white "burn" painted
          on top of the visible content. */}
      <div
        ref={scrollRef}
        onScroll={updateEdges}
        role="region"
        aria-label={ariaLabel}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth scroll-pl-4 px-4 pb-2 sm:-mx-6 sm:scroll-pl-6 sm:px-6"
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
          transition: "mask-position 200ms ease",
        }}
      >
        {prompts.map((p, idx) => (
          <div
            key={p.id}
            // snap-always pairs with snap-mandatory so even fast flicks
            // come to rest on a card boundary.
            className="reveal w-[300px] shrink-0 snap-start snap-always md:w-[320px] lg:w-[340px] xl:w-[360px]"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <PromptCard
              prompt={p}
              index={idx + 1}
              unoptimizedImage={
                p.primaryImage?.cdnUrl.includes("picsum.photos") ?? false
              }
              priority={idx < priorityCount}
            />
          </div>
        ))}
      </div>

      {/* ── Scroll-progress pill ─────────────────────────────
          Only shown when there's actually content past the right edge.
          The pill width tracks the visible ratio (more cards visible
          → wider pill), and its left position tracks the user's
          progress through the scroll range. */}
      {canScroll && (
        <div
          aria-hidden
          className="mx-auto mt-3 hidden h-1 w-44 rounded-full bg-border/50 md:block"
        >
          <div
            className="relative h-full rounded-full"
            style={{
              transform: `translateX(${thumbLeftPct}%)`,
              width: `${thumbWidthPct}%`,
              transition:
                "transform 150ms cubic-bezier(0.32, 0.72, 0, 1), width 150ms ease",
              background:
                "linear-gradient(90deg, oklch(0.66 0.21 270 / 0.85), oklch(0.66 0.21 270))",
            }}
          />
        </div>
      )}
    </div>
  );
}
