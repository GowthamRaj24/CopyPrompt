"use client";

import { ArrowRightIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-segment error boundary.
 *
 * Catches uncaught errors in this app's pages and renders a branded
 * fallback with a retry action. The Header + Footer remain visible
 * because this is a segment-level boundary (not the root).
 *
 * Logs to console; in production you'd wire this to your error tracker
 * (Sentry, Highlight, etc.).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <section className="relative flex min-h-[70svh] items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="bg-hero pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="bg-orb pointer-events-none absolute left-1/2 top-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2 opacity-40"
        style={{ background: "oklch(0.64 0.22 25 / 0.20)" }}
      />

      <div className="relative mx-auto max-w-md px-4 py-14 text-center sm:px-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive">
          Something went wrong
        </p>

        <h1 className="mt-3 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
          We hit a snag rendering this page
        </h1>

        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
          The error has been logged. Try refreshing, or head back home —
          most things still work.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[10px] text-muted-foreground">
            Reference: <span className="text-foreground">{error.digest}</span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="magnetic inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15),inset_0_1px_0_0_oklch(1_0_0/0.1)] hover:bg-primary/90"
          >
            <RefreshCwIcon className="size-3.5" />
            Try again
          </button>
          <Link
            href="/"
            className="press inline-flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 text-[13px] font-medium transition-all hover:border-border hover:bg-card"
          >
            Back home
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
