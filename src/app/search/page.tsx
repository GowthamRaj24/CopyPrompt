import { ArrowRightIcon, SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PromptCard } from "@/components/prompt/PromptCard";
import { SearchBox } from "@/components/search/SearchBox";
import {
  type SearchSort,
  type SearchType,
  searchPrompts,
} from "@/server/services/prompt.service";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
}

/**
 * Search is per-request: results depend on the query/filter combo.
 * Heart state is hydrated client-side via `FavoritesProvider`, so the
 * server never has to look up the user — one less query per search.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const query = sp.q?.trim();
  return {
    title: query ? `Search: "${query}"` : "Search prompts",
    description: query
      ? `Find AI prompts for "${query}" — for every AI tool, free forever.`
      : "Search the best free prompts for ChatGPT, Claude, Midjourney, Flux and every AI tool.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const type = (
    ["all", "image", "text"].includes(sp.type ?? "")
      ? (sp.type as SearchType)
      : "all"
  ) satisfies SearchType;
  const sort = (
    ["relevance", "popular", "latest", "views", "rated"].includes(sp.sort ?? "")
      ? (sp.sort as SearchSort)
      : "relevance"
  ) satisfies SearchSort;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const { results, total, hasMore } = await searchPrompts({
    query,
    type,
    sort,
    page,
  });

  return (
    <section className="relative">
      {/* Ambient background */}
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[400px]"
      />

      <div className="container relative mx-auto px-4 py-8 sm:px-6 md:py-12">
        {/* Hero search */}
        <div className="reveal mx-auto mb-8 max-w-xl md:mb-12">
          <SearchBox
            autoFocus
            defaultValue={query}
            size="hero"
            placeholder="Search prompts…"
          />
        </div>

        {/* Header */}
        <header className="reveal delay-1 mb-8 flex flex-col gap-3 border-b border-border/40 pb-5 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-1">Search</p>
            <h1 className="text-2xl font-bold tracking-[-0.03em] md:text-4xl">
              {query ? (
                <>
                  Results for{" "}
                  <span className="text-primary">&ldquo;{query}&rdquo;</span>
                </>
              ) : (
                "All prompts"
              )}
            </h1>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {total === 0
                ? "No matches"
                : `${total.toLocaleString()} ${total === 1 ? "result" : "results"}`}
            </p>
          </div>

          <FilterTabs query={query} type={type} sort={sort} />
        </header>

        {/* Grid */}
        {results.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((p, idx) => (
                <div
                  key={p.id}
                  className="reveal"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <PromptCard
                    prompt={p}
                    index={(page - 1) * 24 + idx + 1}
                    unoptimizedImage={
                      p.primaryImage?.cdnUrl.includes("picsum.photos") ??
                      false
                    }
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {(page > 1 || hasMore) && (
              <div className="mt-10 flex items-center justify-between border-t border-border/40 pt-5">
                <PageLink
                  active={page > 1}
                  href={buildPageHref({ q: query, type, sort, page: page - 1 })}
                  label="← Previous"
                />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {page}
                </span>
                <PageLink
                  active={hasMore}
                  href={buildPageHref({ q: query, type, sort, page: page + 1 })}
                  label="Next →"
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function FilterTabs({
  query,
  type,
  sort,
}: {
  query: string;
  type: SearchType;
  sort: SearchSort;
}) {
  const typeOptions: { value: SearchType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "image", label: "Image" },
    { value: "text", label: "Text" },
  ];
  const sortOptions: { value: SearchSort; label: string }[] = [
    { value: "relevance", label: "Relevant" },
    { value: "popular", label: "Popular" },
    { value: "latest", label: "Latest" },
    { value: "views", label: "Most viewed" },
    { value: "rated", label: "Top rated" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
      <SegmentGroup>
        {typeOptions.map((opt) => (
          <SegmentLink
            key={opt.value}
            active={type === opt.value}
            href={buildPageHref({ q: query, type: opt.value, sort, page: 1 })}
          >
            {opt.label}
          </SegmentLink>
        ))}
      </SegmentGroup>

      <SegmentGroup>
        {sortOptions.map((opt) => (
          <SegmentLink
            key={opt.value}
            active={sort === opt.value}
            href={buildPageHref({ q: query, type, sort: opt.value, page: 1 })}
          >
            {opt.label}
          </SegmentLink>
        ))}
      </SegmentGroup>
    </div>
  );
}

function SegmentGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-card/40 p-0.5">
      {children}
    </div>
  );
}

function SegmentLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-6 items-center rounded-md px-2.5 text-[11px] font-medium transition-colors ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-16 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/8 text-primary">
        <SearchIcon className="size-5" strokeWidth={1.8} />
      </div>
      <h2 className="text-[15px] font-semibold">
        {query ? `No prompts found for "${query}"` : "No prompts yet"}
      </h2>
      <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted-foreground">
        Try a different search term or remove filters.
      </p>
      <Link
        href="/"
        className="magnetic mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-medium text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15),inset_0_1px_0_0_oklch(1_0_0/0.1)] hover:bg-primary/90"
      >
        Browse trending
        <ArrowRightIcon className="size-3" />
      </Link>
    </div>
  );
}

function PageLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  if (!active) {
    return (
      <span className="text-[12px] text-muted-foreground/30">{label}</span>
    );
  }
  return (
    <Link
      href={href}
      className="link-underline text-[12px] font-medium text-foreground"
    >
      {label}
    </Link>
  );
}

function buildPageHref(params: {
  q: string;
  type: SearchType;
  sort: SearchSort;
  page: number;
}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.type !== "all") sp.set("type", params.type);
  if (params.sort !== "relevance") sp.set("sort", params.sort);
  if (params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}
