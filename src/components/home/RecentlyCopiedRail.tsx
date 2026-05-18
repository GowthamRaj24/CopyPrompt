"use client";

import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { PromptCarousel } from "@/components/prompt/PromptCarousel";
import type { PromptListItem } from "@/server/services/prompt.service";

/**
 * Signed-in-only "Recently copied" rail.
 *
 * Client-rendered so the homepage HTML stays ISR-cacheable (revalidate=300).
 * Returns `null` for guests or empty histories — the homepage layout
 * collapses cleanly with no flash.
 *
 * Powered by GET /api/account/recent-copies. The endpoint returns an
 * empty array silently for unauthenticated requests, so we don't need to
 * gate on user state ourselves.
 */
export function RecentlyCopiedRail() {
  const [prompts, setPrompts] = useState<PromptListItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/recent-copies?limit=8", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { results: PromptListItem[] };
        if (cancelled) return;
        setPrompts(data.results ?? []);
      } catch {
        // silent — rail just doesn't render
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!prompts || prompts.length === 0) return null;

  return (
    <section className="cv-below-fold relative scroll-mt-20">
      <div className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
        <div className="reveal mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4 md:mb-7">
          <div className="min-w-0">
            <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
              <ClockIcon className="size-3" />
              For you
            </p>
            <h2 className="text-[1.375rem] font-bold leading-tight tracking-[-0.03em] md:text-[1.75rem]">
              Continue where you left off
            </h2>
            <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
              The prompts you recently copied — one tap to re-use them.
            </p>
          </div>
        </div>
        <PromptCarousel prompts={prompts} ariaLabel="Recently copied prompts" />
      </div>
    </section>
  );
}
