import { ArrowRightIcon, SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
  description: "The page you were looking for couldn't be found.",
  robots: { index: false, follow: false },
};

/**
 * Global 404 page. Branded, with clear paths back into the app.
 * Triggered by `notFound()` in server components AND by unmatched routes.
 */
export default function NotFound() {
  return (
    <section className="relative flex min-h-[70svh] items-center justify-center overflow-hidden">
      {/* Ambient background */}
      <div
        aria-hidden
        className="bg-hero pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="bg-orb bg-orb-primary animate-orb-pulse pointer-events-none absolute left-1/2 top-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2 opacity-40"
      />

      <div className="relative mx-auto max-w-md px-4 py-14 text-center sm:px-6">
        {/* Big 404 */}
        <p className="bg-gradient-to-br from-primary to-primary/30 bg-clip-text font-mono text-6xl font-bold tracking-tighter text-transparent sm:text-7xl">
          404
        </p>

        <h1 className="mt-3 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
          We couldn&apos;t find that prompt
        </h1>

        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
          The page may have moved, been removed, or never existed. Try the
          search, or jump back home.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/"
            className="magnetic inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15),inset_0_1px_0_0_oklch(1_0_0/0.1)] hover:bg-primary/90"
          >
            Back home
            <ArrowRightIcon className="size-3.5" />
          </Link>
          <Link
            href="/search"
            className="press inline-flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 text-[13px] font-medium transition-all hover:border-border hover:bg-card"
          >
            <SearchIcon className="size-3.5" />
            Search prompts
          </Link>
        </div>
      </div>
    </section>
  );
}
