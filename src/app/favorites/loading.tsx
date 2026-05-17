import { PromptCardGridSkeleton } from "@/components/prompt/PromptCardSkeleton";

export default function FavoritesLoading() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 border-b border-border pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <div className="skeleton mb-2 h-3 w-20 rounded" />
            <div className="flex items-center gap-3">
              <div className="skeleton size-9 rounded-lg md:size-12" />
              <div className="skeleton h-9 w-40 rounded md:h-10" />
            </div>
            <div className="skeleton mt-3 h-3 w-32 rounded" />
          </div>
          <div className="skeleton h-9 w-28 rounded-md" />
        </header>

        <PromptCardGridSkeleton count={8} />
      </div>
    </section>
  );
}
