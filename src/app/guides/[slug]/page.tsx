import { ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown/Markdown";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getAllGuideSlugs,
  getGuideBySlug,
} from "@/lib/guides/content";
import { articleJsonLd, breadcrumbListJsonLd } from "@/lib/seo/jsonld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guide not found" };

  return {
    title: guide.title,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      url: `/guides/${guide.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
    alternates: { canonical: `/guides/${guide.slug}` },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const jsonLd = [
    breadcrumbListJsonLd([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
      { name: guide.title, url: `/guides/${guide.slug}` },
    ]),
    articleJsonLd({
      url: `/guides/${guide.slug}`,
      headline: guide.title,
      description: guide.description,
      datePublished: guide.publishedAt,
    }),
  ];

  return (
    <article className="relative">
      <JsonLd data={jsonLd} />
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <nav
          className="reveal mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRightIcon className="size-3 text-muted-foreground/40" aria-hidden />
          <Link href="/guides" className="transition-colors hover:text-foreground">
            Guides
          </Link>
          <ChevronRightIcon className="size-3 text-muted-foreground/40" aria-hidden />
          <span className="line-clamp-1 text-foreground">{guide.title}</span>
        </nav>

        <header className="reveal delay-1 mb-10 border-b border-border pb-6">
          <p className="eyebrow mb-2">Guide · {guide.readTimeMinutes} min read</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-balance md:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {guide.description}
          </p>
        </header>

        <div className="guide-prose reveal delay-2 max-w-none">
          <Markdown content={guide.body} />
        </div>

        <footer className="mt-12 border-t border-border/40 pt-8">
          <p className="text-[13px] text-muted-foreground">
            Ready to copy prompts?{" "}
            <Link href="/search" className="link-underline font-medium text-foreground">
              Browse the library
            </Link>{" "}
            or read more{" "}
            <Link href="/guides" className="link-underline font-medium text-foreground">
              guides
            </Link>
            .
          </p>
        </footer>
      </div>
    </article>
  );
}
