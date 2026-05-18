import { FolderIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/lib/auth";
import { listMyCollections } from "@/server/services/collection.service";
import { CollectionsIndexClient } from "./components/CollectionsIndexClient";

export const metadata: Metadata = {
  title: "My collections",
  description: "Organize prompts into private or public boards.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CollectionsIndexPage() {
  const user = await requireUser();
  const collections = await listMyCollections(user.id);

  const total = collections.length;
  const publicCount = collections.filter((c) => c.isPublic).length;

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal delay-1 mb-10 flex flex-col gap-4 border-b border-border pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Your library</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary md:size-12">
                <FolderIcon className="size-4 md:size-5" strokeWidth={2} />
              </span>
              Collections
            </h1>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {total === 0
                ? "Save prompts into boards. Share them or keep private."
                : `${total} ${total === 1 ? "board" : "boards"} · ${publicCount} public`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="press inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:border-foreground/30 hover:bg-muted"
            >
              Back to account
            </Link>
          </div>
        </header>

        <CollectionsIndexClient initial={collections} />
      </div>
    </section>
  );
}
