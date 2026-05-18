/**
 * Submit page loading UI — matches Prompt Studio layout (hero + step nav + panels).
 * Without this file, Next.js falls back to app/loading.tsx (homepage skeleton).
 */
export default function SubmitLoading() {
  return (
    <div
      className="submit-studio relative min-h-screen"
      aria-busy="true"
      aria-label="Loading prompt studio"
    >
      <div className="submit-studio-ambient" aria-hidden />
      <div
        aria-hidden
        className="submit-studio-grid pointer-events-none absolute inset-0"
      />

      {/* Hero — mirrors submit/page.tsx header */}
      <header className="relative border-b border-border/40">
        <div className="container relative mx-auto max-w-[1240px] px-4 py-10 sm:px-6 md:py-14">
          <div className="skeleton mb-6 h-4 w-28 rounded" />

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl flex-1 space-y-3">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-12 w-full max-w-lg rounded md:h-14" />
              <div className="skeleton h-4 w-full max-w-md rounded" />
              <div className="skeleton h-4 w-3/4 max-w-sm rounded" />
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <StatPillSkeleton />
              <StatPillSkeleton />
              <StatPillSkeleton />
            </div>
          </div>
        </div>
      </header>

      {/* Studio workspace — step nav + form panels */}
      <div className="container relative mx-auto max-w-[1240px] px-4 py-8 sm:px-6 md:py-12">
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <StepNavSkeleton />

          <div className="space-y-8 pb-28 lg:pb-8">
            <StudioPanelSkeleton fields={2} tall />
            <StudioPanelSkeleton fields={2} textarea />
            <StudioPanelSkeleton fields={1} tall />
            <StudioPanelSkeleton fields={3} />
            <StudioPanelSkeleton fields={2} submit />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPillSkeleton() {
  return (
    <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5">
      <div className="skeleton h-3 w-12 rounded" />
    </div>
  );
}

function StepNavSkeleton() {
  return (
    <nav aria-hidden className="hidden lg:block">
      <div className="sticky top-24 space-y-1">
        <div className="skeleton mb-4 ml-2 h-3 w-16 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5"
          >
            <div className="skeleton h-3 w-5 rounded" />
            <div className="skeleton h-4 flex-1 rounded" />
          </div>
        ))}
      </div>
    </nav>
  );
}

function StudioPanelSkeleton({
  fields,
  tall,
  textarea,
  submit,
}: {
  fields: number;
  tall?: boolean;
  textarea?: boolean;
  submit?: boolean;
}) {
  return (
    <section className="submit-panel scroll-mt-28 p-6 sm:p-8">
      <header className="mb-6 flex items-center gap-4">
        <div className="skeleton size-12 shrink-0 rounded sm:size-14" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="skeleton h-7 w-40 rounded sm:h-8" />
          <div className="skeleton h-4 w-full max-w-lg rounded" />
        </div>
      </header>

      <div className="space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <FieldSkeleton
            key={i}
            tall={tall && i === fields - 1}
            textarea={textarea && i === fields - 1}
          />
        ))}
        {submit && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="skeleton h-16 w-full max-w-sm rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl sm:w-48" />
          </div>
        )}
      </div>
    </section>
  );
}

function FieldSkeleton({
  tall,
  textarea,
}: {
  tall?: boolean;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-3 w-12 rounded" />
      </div>
      {textarea ? (
        <div className="submit-editor rounded-xl p-3 sm:p-4">
          <div className="skeleton min-h-[180px] w-full rounded-lg" />
        </div>
      ) : tall ? (
        <div className="skeleton h-32 w-full rounded-xl" />
      ) : (
        <div className="skeleton h-12 w-full rounded-xl" />
      )}
    </div>
  );
}
