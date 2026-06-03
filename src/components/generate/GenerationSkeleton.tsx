"use client";

import { SparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Skeleton loader shown while Gemini is composing a prompt.
 *
 * Design notes
 * ────────────
 *   - Mirrors the result card layout 1:1 so the screen doesn't shift
 *     when the real content arrives.
 *   - Each block uses the global `bg-shimmer` class for a Linear-style
 *     diagonal sweep across the skeleton.
 *   - A rotating "did you know" line at the top makes the wait feel
 *     like progress instead of a hang. Tips advance every 2.5s.
 */

const ROTATING_TIPS = [
  "Crafting a role-and-objective opener…",
  "Adding the rules block — dos and don'ts…",
  "Picking the right model for your task…",
  "Naming the most common AI failure mode for this prompt…",
  "Choosing a placeholder format you can fill in fast…",
];

export function GenerationSkeleton() {
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIdx((i) => (i + 1) % ROTATING_TIPS.length);
    }, 2_500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="reveal relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-card/80 via-card/60 to-card/40 p-6 shadow-soft md:p-8">
      {/* Top-right ambient glow that pulses */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-3xl skeleton-glow-pulse"
      />

      {/* Status row — sparkle + rotating progress text */}
      <div className="relative flex items-center gap-3 border-b border-border/40 pb-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/15 text-primary skeleton-icon-spin">
          <SparklesIcon className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Generating
          </p>
          <p
            key={tipIdx}
            className="reveal mt-0.5 text-[13.5px] font-semibold tracking-[-0.005em] text-foreground/90"
          >
            {ROTATING_TIPS[tipIdx]}
          </p>
        </div>
        <span
          aria-hidden
          className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted/40 sm:block"
        >
          <span className="block h-full skeleton-progress" />
        </span>
      </div>

      {/* Title placeholder */}
      <div className="mt-5 space-y-3">
        <div className="bg-shimmer h-5 w-3/4 rounded-md" />
        <div className="bg-shimmer h-5 w-2/5 rounded-md" />
        {/* Pills row */}
        <div className="flex gap-2 pt-1">
          <div className="bg-shimmer h-6 w-24 rounded-md" />
          <div className="bg-shimmer h-6 w-20 rounded-md" />
        </div>
      </div>

      {/* Prompt-block placeholder */}
      <div className="mt-6 space-y-2 rounded-lg border border-border/40 bg-muted/20 p-4">
        <div className="bg-shimmer h-3.5 w-[95%] rounded" />
        <div className="bg-shimmer h-3.5 w-[88%] rounded" />
        <div className="bg-shimmer h-3.5 w-[72%] rounded" />
        <div className="my-2" />
        <div className="bg-shimmer h-3.5 w-[60%] rounded" />
        <div className="bg-shimmer h-3.5 w-[90%] rounded" />
        <div className="bg-shimmer h-3.5 w-[78%] rounded" />
        <div className="my-2" />
        <div className="bg-shimmer h-3.5 w-[55%] rounded" />
        <div className="bg-shimmer h-3.5 w-[80%] rounded" />
      </div>

      {/* Tip placeholder */}
      <div className="mt-4 space-y-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
        <div className="bg-shimmer h-3 w-12 rounded" />
        <div className="bg-shimmer h-3.5 w-[78%] rounded" />
      </div>

      {/* Action row placeholder */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="bg-shimmer h-9 w-28 rounded-md" />
        <div className="bg-shimmer h-9 w-32 rounded-md" />
        <div className="bg-shimmer h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}
