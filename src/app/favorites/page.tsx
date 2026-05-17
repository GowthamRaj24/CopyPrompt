import { ArrowRightIcon, HeartIcon, SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PromptCard } from "@/components/prompt/PromptCard";
import { requireUser } from "@/server/lib/auth";
import { getUserFavorites } from "@/server/services/favorite.service";

export const metadata: Metadata = {
  title: "Your favorites",
  description: "Prompts you've saved to your mycopyprompt favorites.",
  robots: { index: false, follow: false },
};

// Always fetch fresh on every request — favorites change frequently
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  // Redirects to /signin?next=/favorites if not signed-in
  const user = await requireUser();

  const favorites = await getUserFavorites(user.id, 200);

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        {/* Header — same shape as search / category */}
        <header className="reveal delay-1 mb-10 flex flex-col gap-4 border-b border-border pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Your library</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary md:size-12">
                <HeartIcon
                  className="size-4 fill-primary md:size-5"
                  strokeWidth={2}
                />
              </span>
              Favorites
            </h1>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {favorites.length === 0
                ? "Nothing saved yet"
                : `${favorites.length.toLocaleString()} saved ${favorites.length === 1 ? "prompt" : "prompts"}`}
            </p>
          </div>
          <Link
            href="/search"
            className="press inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-md border border-border bg-card px-3 text-[13px] font-medium transition-all hover:border-foreground/30 hover:bg-muted md:self-auto"
          >
            <SearchIcon className="size-3.5" />
            Find more
          </Link>
        </header>

        {favorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((prompt, idx) => (
              <div
                key={prompt.id}
                className="reveal"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <PromptCard
                  prompt={prompt}
                  initialFavorited
                  unoptimizedImage={
                    prompt.primaryImage?.cdnUrl.includes("picsum.photos") ??
                    false
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

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-20 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <HeartIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">No favorites yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Tap the heart on any prompt to save it here for later. Your
        favorites sync across devices.
      </p>
      <Link
        href="/search"
        className="magnetic mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
      >
        Browse prompts
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </div>
  );
}
