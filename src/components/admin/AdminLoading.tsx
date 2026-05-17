import { Loader2Icon } from "lucide-react";

function AdminLoadingSpinner({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2Icon className="size-4 shrink-0 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}

function AdminPageHeaderSkeleton({
  eyebrow,
  titleWidth = "w-48",
}: {
  eyebrow: string;
  titleWidth?: string;
}) {
  return (
    <header className="mb-8 border-b border-border pb-6 md:mb-10">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <div className={`skeleton h-9 ${titleWidth} rounded md:h-10`} />
      <div className="skeleton mt-3 h-4 w-full max-w-md rounded" />
    </header>
  );
}

/** Shown while requireAdmin() runs (usually brief). */
export function AdminAuthLoading() {
  return (
    <section className="container mx-auto flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 sm:px-6">
      <AdminLoadingSpinner label="Checking admin access…" />
    </section>
  );
}

/** Dashboard (/admin) */
export function AdminDashboardLoading() {
  return (
    <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
      <AdminPageHeaderSkeleton eyebrow="Admin" titleWidth="w-40" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton mt-4 h-10 w-16 rounded" />
            <div className="skeleton mt-3 h-3 w-24 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="skeleton size-10 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-3 w-full max-w-sm rounded" />
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <AdminLoadingSpinner label="Loading dashboard…" />
      </div>
    </section>
  );
}

/** Queue (/admin/queue) */
export function AdminQueueLoading() {
  return (
    <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
      <AdminPageHeaderSkeleton eyebrow="Admin · Queue" titleWidth="w-44" />
      <div className="mb-8 inline-flex gap-1 rounded-md border border-border bg-card p-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-24 rounded" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-5 w-3/4 max-w-md rounded" />
                <div className="skeleton h-3 w-1/2 max-w-xs rounded" />
                <div className="skeleton mt-3 h-20 w-full rounded-lg" />
              </div>
              <div className="flex gap-2">
                <div className="skeleton h-9 w-24 rounded-md" />
                <div className="skeleton h-9 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <AdminLoadingSpinner label="Loading submissions…" />
      </div>
    </section>
  );
}

/** Analytics (/admin/analytics) */
export function AdminAnalyticsLoading() {
  return (
    <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
      <AdminPageHeaderSkeleton
        eyebrow="Admin · Analytics"
        titleWidth="w-56"
      />

      <div className="mb-10">
        <div className="skeleton mb-4 h-4 w-32 rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton mt-3 h-8 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <div className="skeleton mb-4 h-4 w-28 rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton mt-3 h-8 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <div className="skeleton mb-4 h-4 w-36 rounded" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton mt-4 h-14 w-full rounded" />
              <div className="skeleton mt-3 h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="skeleton h-3 w-40 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-t border-border/60 px-4 py-3"
          >
            <div className="skeleton h-4 w-6 rounded" />
            <div className="skeleton h-4 flex-1 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <AdminLoadingSpinner label="Loading analytics…" />
      </div>
    </section>
  );
}
