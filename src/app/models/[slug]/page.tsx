import {
  ArrowRightIcon,
  ChevronRightIcon,
  ImageIcon,
  MessageSquareIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadMorePromptGrid } from "@/components/prompt/LoadMorePromptGrid";
import { EditorialIntro } from "@/components/seo/EditorialIntro";
import { JsonLd } from "@/components/seo/JsonLd";
import { getModelEditorial } from "@/lib/seo/editorial";
import {
  breadcrumbListJsonLd,
  collectionPageJsonLd,
  itemListJsonLd,
} from "@/lib/seo/jsonld";
import { PAGINATION } from "@/server/config/constants";
import {
  countPublishedPromptsForModel,
  getModelBySlug,
  getPromptsByModelPage,
} from "@/server/services/model-catalog.service";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) return { title: "Model not found" };

  const title = `Free ${model.name} prompts — copy & paste`;
  const description = `Curated, copy-paste-ready prompts for ${model.name}. Browse ${model.type === "image" ? "image" : "text"} prompts — free forever on My Copyprompt.`;

  return {
    title: `${model.name} prompts`,
    description,
    keywords: [
      `${model.name} prompts`,
      `free ${model.name} prompts`,
      `${model.name} prompt examples`,
      `${model.type} AI prompts`,
      "prompt library",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `/models/${model.slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/models/${model.slug}` },
  };
}

export default async function ModelPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = sp.sort === "latest" ? "latest" : "popular";

  const model = await getModelBySlug(slug);
  if (!model) notFound();

  const promptCount = await countPublishedPromptsForModel(model.id);

  const { results, hasMore } = await getPromptsByModelPage({
    modelId: model.id,
    sort,
    page: 1,
    pageSize: PAGINATION.CATEGORY_PAGE_SIZE,
  });

  const promptsApiUrl = `/api/models/${model.slug}/prompts?sort=${sort}`;
  const isImage = model.type === "image";

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Models", url: "/models" },
    { name: model.name, url: `/models/${model.slug}` },
  ];

  const itemList = itemListJsonLd(
    results.map((r) => ({ name: r.title, url: `/prompt/${r.slug}` })),
    {
      name: `${model.name} prompts`,
      description: `Free prompts for ${model.name}.`,
    },
  );

  const jsonLd = [
    breadcrumbListJsonLd(breadcrumbItems),
    collectionPageJsonLd({
      url: `/models/${model.slug}`,
      name: `${model.name} prompts`,
      description: `Curated prompts for ${model.name}.`,
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
          <Link href="/models" className="transition-colors hover:text-foreground">
            Models
          </Link>
          <ChevronRightIcon className="size-3 text-muted-foreground/40" aria-hidden />
          <span className="text-foreground">{model.name}</span>
        </nav>

        <header className="reveal delay-1 mb-10 flex flex-col gap-4 border-b border-border pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">AI model</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary md:size-12">
                {isImage ? (
                  <ImageIcon className="size-4 md:size-5" strokeWidth={2} />
                ) : (
                  <MessageSquareIcon className="size-4 md:size-5" strokeWidth={2} />
                )}
              </span>
              {model.name}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] text-muted-foreground md:text-[15px]">
              Free {isImage ? "image" : "text"} prompts built for{" "}
              <span className="font-medium text-foreground">{model.name}</span>
              . One click to copy.
            </p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {promptCount === 0
                ? "No prompts yet"
                : `${promptCount.toLocaleString()} ${promptCount === 1 ? "prompt" : "prompts"}`}
            </p>
          </div>
          <SortTabs slug={model.slug} sort={sort} />
        </header>

        <EditorialIntro
          paragraphs={getModelEditorial(
            model.slug,
            model.name,
            model.type,
            promptCount,
          )}
        />

        {results.length === 0 ? (
          <EmptyState modelName={model.name} />
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
}: {
  slug: string;
  sort: "popular" | "latest";
}) {
  return (
    <div className="inline-flex items-center gap-0.5 self-start rounded-md border border-border bg-card p-0.5 md:self-auto">
      <SortLink active={sort === "popular"} href={`/models/${slug}`}>
        Popular
      </SortLink>
      <SortLink
        active={sort === "latest"}
        href={`/models/${slug}?sort=latest`}
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

function EmptyState({ modelName }: { modelName: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-20 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <SparklesIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">
        No {modelName} prompts yet
      </h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Be the first to submit one for this model.
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
