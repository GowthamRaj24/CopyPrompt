import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BellIcon,
  SearchIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/lib/auth";
import { listSavedSearchesForUser } from "@/server/services/saved-search.service";
import { SavedSearchesClient } from "./components/SavedSearchesClient";

export const metadata: Metadata = {
  title: "Saved searches",
  description: "Email alerts for new prompts that match your filters.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SavedSearchesPage() {
  const user = await requireUser();
  const items = await listSavedSearchesForUser(user.id);

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <Link
          href="/account"
          className="reveal mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3" />
          Back to account
        </Link>

        <header className="reveal delay-1 mb-10 flex flex-col gap-4 border-b border-border pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Your library</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary md:size-12">
                <BellIcon className="size-4 md:size-5" strokeWidth={2} />
              </span>
              Saved searches
            </h1>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {items.length === 0
                ? "We'll email you when new prompts match what you care about."
                : `${items.length} active ${items.length === 1 ? "alert" : "alerts"} — checked daily`}
            </p>
          </div>
          <Link
            href="/search"
            className="press inline-flex h-9 items-center gap-1.5 self-start rounded-md border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:border-foreground/30 hover:bg-muted md:self-auto"
          >
            <SearchIcon className="size-3.5" />
            Run a search
          </Link>
        </header>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <SavedSearchesClient initial={items} />
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="reveal delay-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <BellIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">No saved searches yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Run a search, then click <strong>Save search</strong> in the
        toolbar. We&apos;ll email you when new matches publish.
      </p>
      <Link
        href="/search"
        className="magnetic mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
      >
        Browse prompts <ArrowRightIcon className="size-3.5" />
      </Link>
    </div>
  );
}
