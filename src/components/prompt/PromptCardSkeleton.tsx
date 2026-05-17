/**
 * Skeleton state for the redesigned PromptCard.
 * Matches the real card's 16:10 visual + content structure
 * to prevent layout shifts during loading.
 */
export function PromptCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 to-card/85 shadow-soft dark:border-white/[0.06] dark:from-card/90 dark:to-card/70 dark:shadow-none"
      aria-hidden="true"
    >
      {/* Visual region — 16:10 */}
      <div className="skeleton aspect-[16/10] w-full" />

      {/* Content region */}
      <div className="flex flex-col px-4 pt-3.5 pb-4">
        {/* Model badge */}
        <div className="mb-2 flex items-center gap-2">
          <div className="skeleton h-[19px] w-24 rounded-md" />
        </div>

        {/* Title lines */}
        <div className="skeleton h-4 w-[90%] rounded" />
        <div className="skeleton mt-1.5 h-4 w-[60%] rounded" />

        {/* Excerpt */}
        <div className="skeleton mt-2 h-3 w-[80%] rounded" />

        {/* Footer */}
        <div className="mt-4 flex items-center gap-3 border-t border-border/30 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="skeleton size-3 rounded-full" />
            <div className="skeleton h-3 w-10 rounded" />
          </div>
          <div className="skeleton h-2.5 w-14 rounded" />
          <div className="flex-1" />
          <div className="flex items-center gap-0.5">
            <div className="skeleton size-8 rounded-lg" />
            <div className="skeleton size-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of N skeleton cards, default 8.
 */
export function PromptCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable static skeleton
        <PromptCardSkeleton key={i} />
      ))}
    </div>
  );
}
