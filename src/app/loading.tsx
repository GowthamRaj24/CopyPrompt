import { PromptCardGridSkeleton } from "@/components/prompt/PromptCardSkeleton";

/**
 * Root-level loading fallback. Used when navigating to the homepage
 * before its data resolves.
 */
export default function HomeLoading() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="bg-hero pointer-events-none absolute inset-0"
        />
        <div className="container relative mx-auto flex min-h-[72svh] flex-col items-center justify-center px-4 py-14 text-center sm:px-6 sm:py-18 md:py-22">
          <div className="skeleton h-6 w-48 rounded-full" />
          <div className="skeleton mt-5 h-12 w-[80%] max-w-2xl rounded md:h-16" />
          <div className="skeleton mt-2 h-12 w-[55%] max-w-lg rounded md:h-16" />
          <div className="skeleton mt-4 h-4 w-[65%] max-w-md rounded" />
          <div className="skeleton mt-8 h-13 w-full max-w-xl rounded-xl sm:h-14 md:mt-10 md:h-[60px]" />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            <div className="skeleton h-5 w-10 rounded-full" />
            <div className="skeleton h-5 w-28 rounded-full" />
            <div className="skeleton h-5 w-32 rounded-full" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border/40">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </section>

      {/* Trending */}
      <section className="container mx-auto px-4 py-14 sm:px-6 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-7 w-52 rounded md:h-8" />
            <div className="skeleton h-3 w-40 rounded" />
          </div>
          <div className="skeleton h-4 w-14 rounded" />
        </div>
        <PromptCardGridSkeleton count={8} />
      </section>
    </>
  );
}
