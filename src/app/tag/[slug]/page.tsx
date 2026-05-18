import {
  ArrowRightIcon,
  ChevronRightIcon,
  HashIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadMorePromptGrid } from "@/components/prompt/LoadMorePromptGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbListJsonLd,
  collectionPageJsonLd,
  itemListJsonLd,
} from "@/lib/seo/jsonld";
import { PAGINATION } from "@/server/config/constants";
import { getPromptsByTagPage, getTagBySlug } from "@/server/services/tag.service";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Tag not found" };

  const title = `#${tag.name} AI prompts — free for ChatGPT, Midjourney & more`;
  const description = `Browse free, copy-paste-ready prompts tagged #${tag.name.toLowerCase()} for ChatGPT, Claude, Midjourney, Flux, Gemini and every major AI tool.`;

  return {
    title: `#${tag.name} prompts`,
    description,
    keywords: [
      `${tag.name} prompts`,
      `${tag.name} AI prompts`,
      `${tag.name} Midjourney prompts`,
      "free AI prompts",
      "prompt library",
    ],
    openGraph: { title, description, type: "website", url: `/tag/${tag.slug}` },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = sp.sort === "latest" ? "latest" : "popular";

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const { results, hasMore } = await getPromptsByTagPage({
    tagId: tag.id,
    sort,
    page: 1,
    pageSize: PAGINATION.CATEGORY_PAGE_SIZE,
  });

  const promptsApiUrl = `/api/tags/${tag.slug}/prompts?sort=${sort}`;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Browse", url: "/search" },
    { name: `#${tag.name}`, url: `/tag/${tag.slug}` },
  ];

  const itemList = itemListJsonLd(
    results.map((r) => ({ name: r.title, url: `/prompt/${r.slug}` })),
    {
      name: `#${tag.name} prompts`,
      description: `Free prompts tagged #${tag.name.toLowerCase()}.`,
    },
  );

  const jsonLd = [
    breadcrumbListJsonLd(breadcrumbItems),
    collectionPageJsonLd({
      url: `/tag/${tag.slug}`,
      name: `#${tag.name} prompts`,
      description: `Curated prompts tagged #${tag.name.toLowerCase()}.`,
      itemList,
    }),
  ];

  return (
    <section className="relative">
      <JsonLd data={jsonLd} />
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <nav
          className="reveal mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRightIcon className="size-3 text-muted-foreground/40" aria-hidden />
          <Link href="/search" className="transition-colors hover:text-foreground">
            Browse
          </Link>
          <ChevronRightIcon className="size-3 text-muted-foreground/40" aria-hidden />
          <span className="text-foreground">#{tag.name}</span>
        </nav>

        <header className="reveal delay-1 mb-10 flex flex-col gap-4 border-b border-border pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Tag</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary md:size-12">
                <HashIcon className="size-4 md:size-5" strokeWidth={2} />
              </span>
              #{tag.name}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] text-muted-foreground md:text-[15px]">
              Free prompts tagged{" "}
              <span className="font-medium text-foreground">#{tag.name}</span>{" "}
              — copy and paste for any AI tool.
            </p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {results.length === 0
                ? "No prompts yet"
                : `${results.length.toLocaleString()} ${results.length === 1 ? "prompt" : "prompts"}`}
            </p>
          </div>
          <SortTabs slug={tag.slug} sort={sort} basePath="tag" />
        </header>

        {results.length === 0 ? (
          <EmptyState />
        ) : (
          <LoadMorePromptGrid
            initialItems={results}
            initialHasMore={hasMore}
            fetchUrl={promptsApiUrl}
          />
        )}
      </div>
    </section>
  );
}

function SortTabs({
  slug,
  sort,
  basePath,
}: {
  slug: string;
  sort: "popular" | "latest";
  basePath: "tag" | "models";
}) {
  return (
    <div className="inline-flex items-center gap-0.5 self-start rounded-md border border-border bg-card p-0.5 md:self-auto">
      <SortLink active={sort === "popular"} href={`/${basePath}/${slug}`}>
        Popular
      </SortLink>
      <SortLink
        active={sort === "latest"}
        href={`/${basePath}/${slug}?sort=latest`}
      >
        Latest
      </SortLink>
    </div>
  );
}

function SortLink({
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
      className={`inline-flex h-7 items-center rounded px-3 text-[12px] font-medium transition-colors ${
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-20 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <SparklesIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">No prompts with this tag yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Submit a prompt and add this tag, or browse other tags.
      </p>
      <Link
        href="/submit"
        className="magnetic mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
      >
        Submit a prompt
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </div>
  );
}
