import { ArrowLeftIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PromptCard } from "@/components/prompt/PromptCard";
import { SITE_BRAND, getSiteHostname } from "@/lib/site-brand";
import {
  getPromptBySlug,
  listRemixesOfPrompt,
} from "@/server/services/prompt.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const source = await getPromptBySlug(slug);
  if (!source) {
    return { title: "Prompt not found", robots: { index: false } };
  }
  const title = `Remixes of "${source.title}"`;
  const description = `Community remixes of the ${source.model.name} prompt "${source.title}" on ${SITE_BRAND.displayName}.`;
  const canonical = `https://${getSiteHostname()}/prompt/${source.slug}/remixes`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_BRAND.name,
    },
    robots: { index: source.remixCount > 0, follow: true },
  };
}

export const revalidate = 300;

export default async function PromptRemixesPage({ params }: PageProps) {
  const { slug } = await params;
  const source = await getPromptBySlug(slug);
  if (!source) notFound();

  const remixes = await listRemixesOfPrompt(source.id, 48);

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <Link
          href={`/prompt/${source.slug}`}
          className="reveal mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3" />
          Back to original prompt
        </Link>

        <header className="reveal delay-1 mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
            <RefreshCwIcon className="size-3" />
            Remixes
          </p>
          <h1 className="line-clamp-2 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            Remixes of "{source.title}"
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Community versions inspired by the{" "}
            <Link
              href={`/prompt/${source.slug}`}
              className="font-medium text-foreground hover:text-primary"
            >
              original {source.model.name} prompt
            </Link>
            .
          </p>
        </header>

        {remixes.length === 0 ? (
          <EmptyRemixes sourceSlug={source.slug} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {remixes.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                unoptimizedImage={
                  p.primaryImage?.cdnUrl.includes("picsum.photos") ?? false
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyRemixes({ sourceSlug }: { sourceSlug: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <SparklesIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">No remixes yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Be the first to remix this prompt — tweak the wording, change the
        model, or aim it at a different audience.
      </p>
      <Link
        href={`/submit?remix_from=${sourceSlug}`}
        className="magnetic mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
      >
        <RefreshCwIcon className="size-3.5" />
        Remix this prompt
      </Link>
    </div>
  );
}
