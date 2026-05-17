"use client";

import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  PencilIcon,
  QuoteIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const ROTATING_QUOTES = [
  {
    text: "The prompt you almost deleted might be someone's breakthrough.",
    author: "For every tinkerer who finally nailed it",
  },
  {
    text: "Share what worked. Skip the trial-and-error for everyone else.",
    author: "Community over gatekeeping",
  },
  {
    text: "One great prompt saves an hour. A library saves thousands.",
    author: "Compound generosity",
  },
  {
    text: "If it worked for you twice, it deserves to be here.",
    author: "Quality bar, human-reviewed",
  },
  {
    text: "Drop the template you'd send a friend — not the one you'd sell.",
    author: "Builders help builders",
  },
  {
    text: "Your best workflow isn't a secret. It's a gift waiting to be copied.",
    author: "Pay it forward",
  },
] as const;

const STEPS = [
  {
    icon: PencilIcon,
    title: "You submit",
    detail: "Four fields · ~2 minutes",
  },
  {
    icon: ClockIcon,
    title: "We review",
    detail: "Real humans · ~24 hours",
  },
  {
    icon: SparklesIcon,
    title: "It goes live",
    detail: "Searchable · copy-ready",
  },
] as const;

const TRUST = [
  "Free forever",
  "Human-reviewed",
  "Email when approved",
] as const;

export function SubmitPromptCta() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);

  const goTo = useCallback((next: number) => {
    setVisible(false);
    window.setTimeout(() => {
      setIndex(next % ROTATING_QUOTES.length);
      setVisible(true);
    }, 220);
  }, []);

  const next = useCallback(() => {
    goTo((index + 1) % ROTATING_QUOTES.length);
  }, [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(next, 5200);
    return () => window.clearInterval(id);
  }, [paused, next]);

  const quote = ROTATING_QUOTES[index];

  return (
    <section className="border-t border-border/40" aria-labelledby="submit-cta-heading">
      <div className="container mx-auto px-4 py-14 sm:px-6 md:py-20">
        <div
          className="reveal relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-card backdrop-blur-sm"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Gradient frame */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-[#3B82F6]/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 size-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 left-0 size-56 rounded-full bg-[#3B82F6]/10 blur-3xl"
          />

          <div className="relative grid gap-10 p-6 sm:p-8 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:p-10 lg:p-12">
            {/* Left — story + rotating quote */}
            <div className="flex flex-col justify-center">
              <p className="eyebrow mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-0.5">
                <SparklesIcon className="size-3 text-primary" strokeWidth={2} />
                Contribute
              </p>

              <h2
                id="submit-cta-heading"
                className="max-w-lg text-balance text-[1.5rem] font-bold leading-[1.12] tracking-[-0.03em] md:text-[1.875rem]"
              >
                Got a prompt that{" "}
                <span className="bg-gradient-to-r from-[#3B82F6] via-primary to-[#8B5CF6] bg-clip-text text-transparent">
                  actually delivers?
                </span>
              </h2>

              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Share the exact wording, tags, and sample output. We test every
                submission before it hits the library.
              </p>

              {/* Rotating quote */}
              <figure
                className="mt-8 min-h-[108px] rounded-xl border border-border/50 bg-background/50 p-4 shadow-soft sm:p-5"
                aria-live="polite"
                aria-atomic="true"
              >
                <QuoteIcon
                  className="mb-2 size-4 text-primary/70"
                  strokeWidth={2}
                  aria-hidden
                />
                <blockquote
                  className={`text-[15px] font-medium leading-snug tracking-[-0.01em] text-foreground transition-opacity duration-300 md:text-[16px] ${
                    visible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  &ldquo;{quote.text}&rdquo;
                </blockquote>
                <figcaption
                  className={`mt-2 text-[12px] text-muted-foreground transition-opacity duration-300 ${
                    visible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  — {quote.author}
                </figcaption>

                <div
                  className="mt-4 flex items-center gap-1.5"
                  role="tablist"
                  aria-label="Rotate contributor quotes"
                >
                  {ROTATING_QUOTES.map((_, i) => (
                    <button
                      key={ROTATING_QUOTES[i].text.slice(0, 24)}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={`Quote ${i + 1} of ${ROTATING_QUOTES.length}`}
                      onClick={() => goTo(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === index
                          ? "w-6 bg-primary"
                          : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              </figure>

              <ul className="mt-5 flex flex-wrap gap-2">
                {TRUST.map((label) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    <CheckCircle2Icon
                      className="size-3 text-primary"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — steps + CTAs */}
            <div className="flex flex-col justify-center">
              <ol className="space-y-3">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <li
                      key={step.title}
                      className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 p-3.5 transition-colors hover:border-primary/25 hover:bg-background/70"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                        <Icon className="size-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold tracking-[-0.01em]">
                          <span className="mr-2 font-mono text-[10px] font-medium text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {step.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {step.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <Link
                  href="/submit"
                  className="magnetic inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15),inset_0_1px_0_0_oklch(1_0_0/0.1),0_4px_14px_-4px_oklch(0.66_0.21_270_/_0.4)] hover:bg-primary/90 sm:flex-none sm:px-6"
                >
                  Submit a prompt
                  <ArrowRightIcon className="size-3.5" aria-hidden />
                </Link>
                <Link
                  href="/search"
                  className="press inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border/60 bg-card/60 px-5 text-[13px] font-medium transition-all hover:border-border hover:bg-card sm:flex-none"
                >
                  Browse the archive
                </Link>
              </div>

              <p className="mt-4 text-center text-[11.5px] text-muted-foreground/80 sm:text-left">
                Sign in once · paste your prompt · we handle the rest
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
