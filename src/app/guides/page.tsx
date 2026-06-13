import { BookOpenIcon, ClockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbListJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { GUIDE_ARTICLES } from "@/lib/guides/content";
import { SITE_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Prompt engineering guides",
  description:
    "Free, in-depth guides on ChatGPT, Claude, Midjourney, and Flux prompting — written by the My Copyprompt team to help you get better AI results.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndexPage() {
  const jsonLd = [
    breadcrumbListJsonLd([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
    ]),
    itemListJsonLd(
      GUIDE_ARTICLES.map((g) => ({
        name: g.title,
        url: `/guides/${g.slug}`,
      })),
      {
        name: `${SITE_BRAND.displayName} prompt guides`,
        description:
          "Original tutorials on prompt engineering for text and image AI tools.",
      },
    ),
  ];

  return (
    <section className="relative">
      <JsonLd data={jsonLd} />
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
            <BookOpenIcon className="size-3" aria-hidden />
            Guides
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            Learn prompt engineering
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
            Original tutorials on writing prompts that work in production — not
            generic listicles. Each guide includes copy-ready patterns you can
            use in ChatGPT, Claude, Midjourney, Flux, and the rest of the
            catalog on {SITE_BRAND.displayName}.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDE_ARTICLES.map((guide, idx) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="lift reveal flex h-full flex-col rounded-xl border border-border/50 bg-card/60 p-5 transition-all hover:border-primary/30 hover:bg-card"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-foreground md:text-[17px]">
                {guide.title}
              </h2>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                {guide.description}
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <ClockIcon className="size-3" aria-hidden />
                {guide.readTimeMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
