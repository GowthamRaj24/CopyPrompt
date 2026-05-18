import {
  ArrowRightIcon,
  FolderIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND, getSiteHostname } from "@/lib/site-brand";
import {
  listCuratedCollections,
  listPopularPublicCollections,
} from "@/server/services/collection.service";

type CollectionTile = Awaited<
  ReturnType<typeof listCuratedCollections>
>[number];

export const metadata: Metadata = {
  title: "Curated prompt collections",
  description: `Hand-picked AI prompt playbooks on ${SITE_BRAND.displayName} — themed boards for every workflow.`,
  alternates: { canonical: `https://${getSiteHostname()}/collections` },
  openGraph: {
    title: `Curated prompt collections on ${SITE_BRAND.displayName}`,
    description: `Hand-picked AI prompt playbooks on ${SITE_BRAND.displayName} — themed boards for every workflow.`,
    type: "website",
    siteName: SITE_BRAND.name,
  },
};

export const revalidate = 600;

async function safeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[collections] ${label} failed:`, err);
    return fallback;
  }
}

export default async function CollectionsIndexPage() {
  const [curated, popular] = await Promise.all([
    safeQuery(
      "curated",
      () => listCuratedCollections(12),
      [] as Awaited<ReturnType<typeof listCuratedCollections>>,
    ),
    safeQuery(
      "popular",
      () => listPopularPublicCollections(24),
      [] as Awaited<ReturnType<typeof listPopularPublicCollections>>,
    ),
  ]);

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal delay-1 mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
            <FolderIcon className="size-3" />
            Collections
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.025em] md:text-5xl">
            Prompt playbooks
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Themed boards of prompts — curated by our team and the community.
            Save, share, and follow your favorites.
          </p>
        </header>

        {curated.length > 0 && (
          <section className="reveal delay-2 mb-12">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
                  <SparklesIcon className="size-3" />
                  Curated picks
                </p>
                <h2 className="text-[1.375rem] font-bold tracking-[-0.03em] md:text-[1.75rem]">
                  Hand-picked by our team
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {curated.map((c) => (
                <CollectionTile key={c.id} c={c} curated />
              ))}
            </div>
          </section>
        )}

        {popular.length > 0 && (
          <section className="reveal delay-3">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
                  <FolderIcon className="size-3" />
                  Community
                </p>
                <h2 className="text-[1.375rem] font-bold tracking-[-0.03em] md:text-[1.75rem]">
                  Popular community boards
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((c) => (
                <CollectionTile key={c.id} c={c} />
              ))}
            </div>
          </section>
        )}

        {curated.length === 0 && popular.length === 0 && (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

function CollectionTile({
  c,
  curated,
}: {
  c: CollectionTile;
  curated?: boolean;
}) {
  return (
    <Link
      href={`/c/${c.slug}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border/60 bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/50 bg-background/60 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary">
          <FolderIcon className="size-4" strokeWidth={2} />
        </div>
        {curated && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <SparklesIcon className="size-2.5" strokeWidth={2.5} />
            Curated
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[14px] font-semibold tracking-[-0.01em] transition-colors group-hover:text-primary">
          {c.name}
        </p>
        {c.description && (
          <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
            {c.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-2.5 text-[11px] text-muted-foreground">
        <span className="font-mono tabular-nums">
          {c.promptCount} {c.promptCount === 1 ? "prompt" : "prompts"}
        </span>
        {c.ownerHandle && (
          <span className="inline-flex items-center gap-1 truncate">
            <UserIcon className="size-2.5" />@{c.ownerHandle}
          </span>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <FolderIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">No collections yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Create one of your own and make it public — yours could be the first
        on this page.
      </p>
      <Link
        href="/account/collections"
        className="magnetic mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
      >
        Build your first
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </div>
  );
}
