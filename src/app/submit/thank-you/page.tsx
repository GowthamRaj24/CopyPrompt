import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanks for submitting",
  description: "Your prompt is in the moderation queue.",
  robots: { index: false, follow: false },
};

/**
 * Confetti config — deterministic across renders (no hydration mismatch).
 * Each piece gets a column position, a horizontal drift, color, delay & duration.
 */
const CONFETTI = Array.from({ length: 36 }).map((_, i) => {
  // Pseudo-random but stable
  const seed = (n: number) =>
    Math.abs(Math.sin(i * 91.7 + n)) % 1;

  const colors = [
    "oklch(0.66 0.21 270)", // primary indigo
    "oklch(0.7 0.18 220)", // cyan
    "oklch(0.7 0.18 160)", // emerald
    "oklch(0.78 0.15 80)", // gold
    "oklch(0.72 0.18 30)", // coral
  ];

  return {
    left: `${(seed(1) * 100).toFixed(2)}%`,
    cx: `${(seed(2) * 200 - 100).toFixed(0)}px`,
    color: colors[i % colors.length],
    delay: `${(seed(3) * 0.6).toFixed(2)}s`,
    duration: `${(2.8 + seed(4) * 2.2).toFixed(2)}s`,
    width: i % 3 === 0 ? "10px" : "7px",
    height: i % 4 === 0 ? "16px" : "12px",
    skew: `${(seed(5) * 30 - 15).toFixed(0)}deg`,
  };
});

export default function ThankYouPage() {
  return (
    <section className="relative flex min-h-[80svh] items-center justify-center overflow-hidden">
      {/* ── Atmosphere ──────────────────────────────────── */}
      <div
        aria-hidden
        className="bg-hero pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-25"
      />
      <div aria-hidden className="bg-aurora" />
      <div
        aria-hidden
        className="bg-orb bg-orb-primary animate-orb-pulse pointer-events-none absolute left-1/2 top-1/2 size-[480px] -translate-x-1/2 -translate-y-1/2 opacity-60"
      />

      {/* ── Confetti ────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={
              {
                left: c.left,
                background: c.color,
                width: c.width,
                height: c.height,
                transform: `skewX(${c.skew})`,
                ["--cx" as string]: c.cx,
                ["--dur" as string]: c.duration,
                ["--delay" as string]: c.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="relative mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        {/* Sparkle eyebrow */}
        <div className="reveal mx-auto inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-md">
          <SparklesIcon className="size-3 text-primary" />
          Submission received
        </div>

        {/* Big check */}
        <div className="reveal delay-1 relative mx-auto mt-6 grid size-16 place-items-center">
          <div
            aria-hidden
            className="absolute inset-0 animate-glow-breathe rounded-full"
          />
          <div className="grid size-16 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-inset ring-primary/20">
            <CheckCircle2Icon className="size-8" strokeWidth={2} />
          </div>
        </div>

        <h1 className="hero-enter mt-6 text-3xl font-bold tracking-[-0.03em] md:text-5xl">
          You&apos;re a{" "}
          <span className="bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent">
            legend.
          </span>
        </h1>

        <p className="reveal delay-2 mt-3 text-balance text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
          Your prompt is in the moderation queue. We hand-review every
          submission to keep the archive sharp.
        </p>

        {/* ── Timeline ───────────────────────────────────── */}
        <div className="reveal delay-3 mt-10">
          <p className="eyebrow !text-muted-foreground/70 mb-3">
            What happens next
          </p>
          <div className="relative grid grid-cols-3 gap-3">
            <TimelineStep
              icon={<CheckCircle2Icon className="size-4" />}
              label="Submitted"
              sublabel="just now"
              status="done"
            />
            <TimelineStep
              icon={<ClockIcon className="size-4" />}
              label="Review"
              sublabel="within 24h"
              status="active"
            />
            <TimelineStep
              icon={<RocketIcon className="size-4" />}
              label="Live"
              sublabel="published"
              status="pending"
            />
          </div>
        </div>

        {/* ── CTAs ───────────────────────────────────────── */}
        <div className="reveal delay-5 mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="magnetic inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
          >
            Browse prompts
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="/submit"
            className="press inline-flex h-11 items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-5 text-[14px] font-medium backdrop-blur-md transition-all hover:border-border hover:bg-card"
          >
            <SparklesIcon className="size-3.5 text-primary" />
            Submit another
          </Link>
        </div>

        <p className="reveal delay-6 mt-6 text-[11px] text-muted-foreground/70">
          We&apos;ll email you the moment it goes live.
        </p>
      </div>
    </section>
  );
}

/* ── Timeline step ──────────────────────────────────────────── */

function TimelineStep({
  icon,
  label,
  sublabel,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  status: "done" | "active" | "pending";
}) {
  const ring =
    status === "done"
      ? "border-primary/40 bg-primary/15 text-primary"
      : status === "active"
        ? "border-primary/30 bg-primary/8 text-primary animate-glow-breathe"
        : "border-border/60 bg-muted/30 text-muted-foreground/60";

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={`grid size-10 place-items-center rounded-full border ${ring}`}
        aria-hidden
      >
        {icon}
      </span>
      <div>
        <p
          className={`text-[12px] font-semibold ${
            status === "pending"
              ? "text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {label}
        </p>
        <p className="text-[10.5px] text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}
