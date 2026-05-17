import { ArrowRightIcon, HeartIcon, ZapIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "CopyPrompt is the fastest way to find, copy and paste the best free AI prompts for ChatGPT, Claude, Midjourney, Flux, Gemini and every AI tool.",
};

export default function AboutPage() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2">About</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            We&apos;re building the fastest{" "}
            <span className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              AI prompt library.
            </span>
          </h1>
        </header>

        <div className="space-y-8 text-[15px] leading-[1.75] text-foreground/90">
          <p>
            CopyPrompt is a hand-picked archive of prompts that actually
            work — for ChatGPT, Claude, Midjourney, Flux, Gemini, and every
            AI tool worth using. Free forever. No signup. No paywall.
          </p>

          <p>
            We built CopyPrompt because the best prompts shouldn&apos;t live
            in scattered Discord servers, locked behind paid bundles, or
            buried in random notebooks. They should be searchable,
            copy-paste ready, and one click away.
          </p>

          <Pillars />

          <h2 className="pt-4 text-xl font-bold tracking-[-0.02em] md:text-2xl">
            How it works
          </h2>
          <ol className="ml-5 list-decimal space-y-2">
            <li>
              Search for what you want to make — a portrait, an essay, a
              code review, anything.
            </li>
            <li>
              Click the prompt that fits.
            </li>
            <li>
              Hit copy. Paste into your AI tool. Done.
            </li>
          </ol>

          <h2 className="pt-4 text-xl font-bold tracking-[-0.02em] md:text-2xl">
            Want to contribute?
          </h2>
          <p>
            We accept submissions from anyone — sign in, paste your prompt,
            and we&apos;ll review it within 24 hours. Quality matters more
            than quantity, so be thoughtful about what you share.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-8">
          <Link
            href="/search"
            className="magnetic inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
          >
            Browse the archive
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="/submit"
            className="press inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card px-5 text-[14px] font-medium transition-all hover:border-foreground/30 hover:bg-muted"
          >
            Submit a prompt
          </Link>
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const items = [
    {
      icon: ZapIcon,
      title: "Speed first",
      body: "Search → click → paste. No accounts, no waiting.",
    },
    {
      icon: HeartIcon,
      title: "Quality curated",
      body: "Every prompt is reviewed before it goes live.",
    },
  ];
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((it) => (
        <li
          key={it.title}
          className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-4"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
            <it.icon className="size-4" />
          </span>
          <div>
            <p className="text-[14px] font-semibold tracking-[-0.005em]">
              {it.title}
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
              {it.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
