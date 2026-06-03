import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

/**
 * Hero "Generate your own with AI" CTA — the secondary path in the
 * homepage hero alongside the search bar.
 *
 * Visual identity is borrowed directly from Google's Gemini surfaces:
 *   - a 2px rotating multi-color gradient border (blue → purple → pink
 *     → yellow → green). The rotation is driven by a TRANSFORM on the
 *     inner `.hero-gen-ring` span (composited, ~0ms TBT). The previous
 *     implementation animated an @property + conic-gradient angle,
 *     which forced a full repaint of the gradient every frame and was
 *     the single biggest contributor to homepage TBT after the AI
 *     generator shipped.
 *   - a soft outer box-shadow that pulses ambient "AI surface" glow;
 *   - a 4-point Gemini star icon with the same gradient that pulses + tilts;
 *   - gradient-painted text that shimmers left-to-right;
 *   - an arrow that shifts right on hover.
 *
 * Server-rendered as a regular `<Link>` so it's indexable + loads
 * without JavaScript. All animations are CSS — no JS hydration cost.
 */
export function HeroGenerateCta() {
  return (
    <Link
      href="/generate"
      aria-label="Generate your own AI prompt with Gemini"
      className="hero-gen-pill press group relative inline-flex items-center gap-2.5 rounded-full bg-card/85 px-4 py-2 text-[13.5px] font-semibold backdrop-blur-md transition-transform duration-300 hover:scale-[1.025] sm:gap-3 sm:px-5 sm:py-2.5"
    >
      {/* Rotating gradient layer behind the masked ring ::before.
          Transform-only animation = composited = no per-frame repaint. */}
      <span aria-hidden className="hero-gen-ring" />

      {/* Mini Gemini 4-point star */}
      <span aria-hidden className="hero-gen-star inline-block">
        <svg viewBox="0 0 24 24" className="size-4 sm:size-[18px]">
          <defs>
            <linearGradient
              id="hero-gen-star-grad"
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
            fill="url(#hero-gen-star-grad)"
          />
        </svg>
      </span>

      {/* Gradient-painted shimmering text */}
      <span className="hero-gen-text">Generate your own with AI</span>

      {/* "New" pill */}
      <span
        aria-hidden
        className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-primary"
      >
        New
      </span>

      {/* Arrow — shifts right on hover */}
      <ArrowRightIcon
        className="size-3.5 shrink-0 text-foreground/70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground"
        strokeWidth={2.2}
      />
    </Link>
  );
}
