import { FolderIcon, SparklesIcon, UserIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromptCard } from "@/components/prompt/PromptCard";
import { SITE_BRAND, getSiteHostname } from "@/lib/site-brand";
import {
  getPublicCollectionBySlug,
  listPromptsInCollection,
} from "@/server/services/collection.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicCollectionBySlug(slug);
  if (!data) {
    return {
      title: "Collection not found",
      robots: { index: false, follow: false },
    };
  }
  const { collection, owner } = data;

  const ownerName = owner?.fullName ?? "a creator";
  const description =
    collection.description ??
    `${collection.promptCount} curated AI prompt${
      collection.promptCount === 1 ? "" : "s"
    } by ${ownerName} on ${SITE_BRAND.displayName}.`;

  const canonical = `https://${getSiteHostname()}/c/${collection.slug}`;

  return {
    title: collection.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: collection.name,
      description,
      url: canonical,
      siteName: SITE_BRAND.name,
    },
    twitter: {
      card: "summary_large_image",
      title: collection.name,
      description,
    },
    robots: {
      index: collection.isPublic || collection.isCurated,
      follow: true,
    },
  };
}

export const revalidate = 300;

export default async function PublicCollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPublicCollectionBySlug(slug);
  if (!data) notFound();

  const { collection, owner } = data;
  const { results: members } = await listPromptsInCollection(
    collection.id,
    1,
    48,
  );

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
            {collection.isCurated ? "Curated" : "Public"} collection
          </p>
          <h1 className="line-clamp-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              {collection.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
            {owner && (
              <span className="inline-flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-muted/60 text-muted-foreground">
                  <UserIcon className="size-3" />
                </span>
                {owner.fullName ?? "Anonymous creator"}
              </span>
            )}
            <span className="font-mono tabular-nums">
              {collection.promptCount}{" "}
              {collection.promptCount === 1 ? "prompt" : "prompts"}
            </span>
          </div>
        </header>

        {members.length === 0 ? (
          <EmptyCollection />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((p) => (
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

function EmptyCollection() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <SparklesIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">Nothing here yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        The owner is still filling this collection. Check back soon.
      </p>
    </div>
  );
}
