import { ArrowLeftIcon, EyeIcon, FolderIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PromptCard } from "@/components/prompt/PromptCard";
import { requireUser } from "@/server/lib/auth";
import {
  getOwnedCollection,
  listPromptsInCollection,
} from "@/server/services/collection.service";
import { CollectionDetailClient } from "./components/CollectionDetailClient";

export const metadata: Metadata = {
  title: "Collection",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const collection = await getOwnedCollection(user.id, id);
  if (!collection) notFound();

  const { results: members } = await listPromptsInCollection(collection.id, 1, 48);

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <Link
          href="/account/collections"
          className="reveal mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3" />
          All collections
        </Link>

        <header className="reveal delay-1 mb-10 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
              <FolderIcon className="size-3" />
              Collection
            </p>
            <h1 className="line-clamp-2 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-2 max-w-2xl text-[13px] text-muted-foreground">
                {collection.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
              <span className="font-mono tabular-nums">
                {collection.promptCount} {collection.promptCount === 1 ? "prompt" : "prompts"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  collection.isPublic
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background/80 text-muted-foreground"
                }`}
              >
                {collection.isPublic ? (
                  <EyeIcon className="size-2.5" />
                ) : (
                  <LockIcon className="size-2.5" />
                )}
                {collection.isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>
          <CollectionDetailClient
            collectionId={collection.id}
            slug={collection.slug}
            initialName={collection.name}
            initialDescription={collection.description}
            initialIsPublic={collection.isPublic}
          />
        </header>

        {members.length === 0 ? (
          <EmptyBoard />
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

function EmptyBoard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <FolderIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">No prompts yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Browse prompts and use the bookmark button to add them to this board.
      </p>
      <Link
        href="/search"
        className="magnetic mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
      >
        Browse prompts
      </Link>
    </div>
  );
}
