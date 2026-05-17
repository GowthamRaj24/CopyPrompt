import { PromptCardGridSkeleton } from "@/components/prompt/PromptCardSkeleton";

export default function SearchLoading() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[400px]"
      />

      <div className="container relative mx-auto px-4 py-8 sm:px-6 md:py-12">
        {/* Search bar placeholder */}
        <div className="mx-auto mb-8 max-w-xl md:mb-12">
          <div className="skeleton h-13 w-full rounded-xl sm:h-14 md:h-[60px]" />
        </div>

        {/* Header placeholder */}
        <header className="mb-8 flex flex-col gap-3 border-b border-border/40 pb-5 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-14 rounded" />
            <div className="skeleton h-8 w-2/3 rounded md:h-9" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
          <div className="skeleton h-7 w-56 rounded-lg" />
        </header>

        <PromptCardGridSkeleton count={8} />
      </div>
    </section>
  );
}
