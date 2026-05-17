import {
  ArrowRightIcon,
  ChevronRightIcon,
  FolderIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PromptCard } from "@/components/prompt/PromptCard";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbListJsonLd,
  collectionPageJsonLd,
  itemListJsonLd,
} from "@/lib/seo/jsonld";
import {
  getCategoryBySlug,
  getPromptsByCategory,
} from "@/server/services/category.service";

/**
 * Caching strategy
 * ────────────────
 * Category pages render the same HTML for every visitor — per-user
 * heart state is hydrated client-side by `FavoritesProvider`. We can
 * therefore cache the page for `revalidate` seconds and skip the
 * user-specific server queries (auth + favorite-id lookup) on every hit.
 */
export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Category not found" };

  const title = `${cat.name} prompts — free for ChatGPT, Claude, Midjourney & more`;
  const description =
    cat.description ??
    `Curated, copy-paste-ready ${cat.name.toLowerCase()} prompts for ChatGPT, Claude, Midjourney, Flux, Gemini and every major AI tool. Free forever.`;

  return {
    title: `${cat.name} prompts`,
    description,
    keywords: [
      `${cat.name} prompts`,
      `${cat.name} AI prompts`,
      `${cat.name} ChatGPT prompts`,
      "free AI prompts",
      "prompt library",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `/category/${cat.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: `/category/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = sp.sort === "latest" ? "latest" : "popular";

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const results = await getPromptsByCategory({
    categoryId: category.id,
    sort,
    limit: 60,
  });

  // ── Structured data ────────────────────────────────────────
  // Breadcrumb tells engines where this page sits in the taxonomy.
  // CollectionPage + ItemList tells them "this is a curated list of N
  // items" so they don't mistake it for a single article.
  const breadcrumbItems: Array<{ name: string; url: string }> = [
    { name: "Home", url: "/" },
    { name: "Browse", url: "/search" },
  ];
  if (category.parentName && category.parentSlug) {
    breadcrumbItems.push({
      name: category.parentName,
      url: `/category/${category.parentSlug}`,
    });
  }
  breadcrumbItems.push({
    name: category.name,
    url: `/category/${category.slug}`,
  });

  const itemList = itemListJsonLd(
    results.map((r) => ({
      name: r.title,
      url: `/prompt/${r.slug}`,
    })),
    {
      name: `${category.name} prompts`,
      description:
        category.description ??
        `Free, copy-paste-ready prompts in the ${category.name} category.`,
    },
  );

  const jsonLd = [
    breadcrumbListJsonLd(breadcrumbItems),
    collectionPageJsonLd({
      url: `/category/${category.slug}`,
      name: `${category.name} prompts`,
      description:
        category.description ??
        `Curated ${category.name.toLowerCase()} prompts for every AI tool.`,
      itemList,
    }),
  ];

  return (
    <section className="relative">
      <JsonLd data={jsonLd} />
      {/* Ambient background */}
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        {/* Breadcrumb */}
        <nav
          className="reveal mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRightIcon
            className="size-3 text-muted-foreground/40"
            aria-hidden
          />
          <Link
            href="/search"
            className="transition-colors hover:text-foreground"
          >
            Browse
          </Link>
          {category.parentName && category.parentSlug && (
            <>
              <ChevronRightIcon
                className="size-3 text-muted-foreground/40"
                aria-hidden
              />
              <Link
                href={`/category/${category.parentSlug}`}
                className="transition-colors hover:text-foreground"
              >
                {category.parentName}
              </Link>
            </>
          )}
          <ChevronRightIcon
            className="size-3 text-muted-foreground/40"
            aria-hidden
          />
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Header — same shape as search / favorites */}
        <header className="reveal delay-1 mb-10 flex flex-col gap-4 border-b border-border pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Category</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary md:size-12">
                <FolderIcon className="size-4 md:size-5" strokeWidth={2} />
              </span>
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-3 max-w-2xl text-[14px] text-muted-foreground md:text-[15px]">
                {category.description}
              </p>
            )}
            <p className="mt-2 text-[12px] text-muted-foreground">
              {results.length === 0
                ? "No prompts yet"
                : `${results.length.toLocaleString()} ${results.length === 1 ? "prompt" : "prompts"}`}
            </p>
          </div>

          {/* Sort */}
          <SortTabs slug={category.slug} sort={sort} />
        </header>

        {/* Grid */}
        {results.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((p, idx) => (
              <div
                key={p.id}
                className="reveal"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <PromptCard
                  prompt={p}
                  index={idx + 1}
                  unoptimizedImage={
                    p.primaryImage?.cdnUrl.includes("picsum.photos") ?? false
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function SortTabs({
  slug,
  sort,
}: {
  slug: string;
  sort: "popular" | "latest";
}) {
  return (
    <div className="inline-flex items-center gap-0.5 self-start rounded-md border border-border bg-card p-0.5 md:self-auto">
      <SortLink active={sort === "popular"} href={`/category/${slug}`}>
        Popular
      </SortLink>
      <SortLink
        active={sort === "latest"}
        href={`/category/${slug}?sort=latest`}
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
      <h2 className="text-[16px] font-semibold">
        No prompts in this category yet
      </h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Be the first to share one, or browse other categories.
      </p>
      <Link
        href="/submit"
        className="magnetic mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
      >
        Submit a prompt
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </div>
  );
}
