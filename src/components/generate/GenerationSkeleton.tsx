"use client";

import { useEffect, useState } from "react";

/**
 * Gemini-style "thinking" loader.
 *
 * Mirrors the loading affordance that Google's own AI surfaces show
 * (Gemini app, AI Overviews, NotebookLM): a continuously flowing
 * multi-color bar at the top, an animated 4-point star with Google's
 * brand-color gradient, rotating status phrases, and streaming text
 * lines that shimmer with the same gradient — communicating "an AI is
 * progressively producing your answer" rather than the generic
 * "skeleton placeholder" we had before.
 *
 * Visual ingredients
 * ──────────────────
 *   1. Top edge: a 3px rainbow bar that flows continuously, signature
 *      to Google's generative surfaces (blue → purple → pink → yellow
 *      → green → blue).
 *   2. Ambient conic glow behind the card that slowly pulses.
 *   3. 4-point Gemini star with the same gradient, rotating + pulsing.
 *   4. Rotating status line ("Drafting the role + objective…",
 *      "Picking the right model…") with a gradient-painted text fill.
 *   5. Three dots that bounce in sequence after the text.
 *   6. 7 streaming-text placeholder lines that fade-in left-to-right
 *      one after the other — mimics how an LLM streams tokens.
 *   7. All animations honour `prefers-reduced-motion`.
 */

const ROTATING_PHRASES = [
  "Drafting the role + objective opener",
  "Picking the right model for your task",
  "Adding the rules and placeholders",
  "Choosing the output format",
  "Naming the most common failure mode",
  "Polishing the final tip",
];

export function GenerationSkeleton() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhraseIdx((i) => (i + 1) % ROTATING_PHRASES.length);
    }, 2_400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="gemini-loader reveal relative overflow-hidden rounded-2xl border border-border/40 bg-card/45 p-6 backdrop-blur-md md:p-8">
      {/* Flowing rainbow bar — Google brand gradient */}
      <span
        aria-hidden
        className="gemini-rainbow-bar pointer-events-none absolute inset-x-0 top-0 h-[3px]"
      />

      {/* Conic ambient glow above the card */}
      <span
        aria-hidden
        className="gemini-ambient-glow pointer-events-none absolute -top-44 left-1/2 size-[28rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
      />

      {/* ── Header: star + status ──────────────────────── */}
      <div className="relative flex items-center gap-4">
        <div className="relative grid size-12 shrink-0 place-items-center">
          <span aria-hidden className="gemini-star-halo absolute inset-0" />
          {/* Gemini-style 4-point star — pure SVG so it crisp at any size */}
          <svg
            viewBox="0 0 24 24"
            className="gemini-star relative size-8"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="gemini-grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="35%" stopColor="#9B72CB" />
                <stop offset="70%" stopColor="#D96570" />
                <stop offset="100%" stopColor="#F4B400" />
              </linearGradient>
            </defs>
            <path
              d="M12 1.5 L13.6 9.5 L21.7 11.1 L21.7 12.9 L13.6 14.5 L12 22.5 L10.4 14.5 L2.3 12.9 L2.3 11.1 L10.4 9.5 Z"
              fill="url(#gemini-grad)"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            Generating with Gemini
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p
              key={phraseIdx}
              className="gemini-status-text text-[15px] font-semibold tracking-[-0.01em] md:text-[16px]"
            >
              {ROTATING_PHRASES[phraseIdx]}
            </p>
            {/* Bouncing dots */}
            <span
              aria-hidden
              className="gemini-dots inline-flex shrink-0 items-end gap-[3px] pb-[3px]"
            >
              <span className="size-[5px] rounded-full" />
              <span className="size-[5px] rounded-full" />
              <span className="size-[5px] rounded-full" />
            </span>
          </div>
        </div>
      </div>

      {/* ── Streaming text lines ───────────────────────── */}
      <div className="relative mt-7 space-y-3">
        {STREAM_LINES.map((width, i) => (
          <div
            key={i}
            className="gemini-stream-line h-3 rounded"
            style={{
              width,
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>

      {/* ── Footer label ───────────────────────────────── */}
      <div className="relative mt-6 flex items-center justify-between border-t border-border/30 pt-4 text-[11px] text-muted-foreground/70">
        <span className="flex items-center gap-1.5">
          <span className="gemini-pulse-dot size-1.5 rounded-full" />
          <span className="font-mono uppercase tracking-wider">Live</span>
        </span>
        <span className="font-mono tabular-nums">~2s typical</span>
      </div>
    </div>
  );
}

/**
 * Pixel-level widths picked by eye so the streaming lines feel like a
 * real LLM token stream — varied lengths, never identical-looking row
 * pairs, last line short to evoke a paragraph break.
 */
const STREAM_LINES = [
  "92%",
  "86%",
  "94%",
  "78%",
  "88%",
  "62%",
  "82%",
  "44%",
];
