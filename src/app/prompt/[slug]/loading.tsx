export default function PromptDetailLoading() {
  return (
    <article className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
      />

      <div className="container relative mx-auto px-4 py-5 sm:px-6 md:py-8">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-1.5">
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* LEFT — Visual */}
          <div className="lg:col-span-5">
            <div className="skeleton aspect-[4/5] w-full rounded-xl" />
          </div>

          {/* RIGHT — Info */}
          <div className="lg:col-span-7">
            <div className="flex items-start justify-between gap-3">
              <div className="skeleton h-6 w-28 rounded-lg" />
              <div className="skeleton size-9 rounded-lg" />
            </div>

            <div className="skeleton mt-3 h-9 w-[80%] rounded md:h-10 lg:h-12" />
            <div className="skeleton mt-2 h-7 w-[55%] rounded" />

            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-3 w-14 rounded" />
            </div>

            <div className="skeleton mt-4 h-3.5 w-3/4 rounded" />

            {/* Big copy button */}
            <div className="skeleton mt-5 h-11 w-full rounded-lg md:h-12" />

            {/* Trust pills */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-5 w-24 rounded-full" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>

            <div className="my-6 h-px bg-border/40" />

            {/* Prompt block */}
            <div className="skeleton h-52 w-full rounded-xl" />

            {/* Parameters */}
            <div className="skeleton mt-5 h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </article>
  );
}
