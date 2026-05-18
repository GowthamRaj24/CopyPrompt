import {
  ArrowRightIcon,
  CalendarIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadMorePromptGrid } from "@/components/prompt/LoadMorePromptGrid";
import {
  type ContributorBadge,
  getContributorBadges,
} from "@/lib/contributor-badges";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { SITE_BRAND, getSiteHostname } from "@/lib/site-brand";
import { getContributorStats } from "@/server/services/contributor.service";
import {
  getCreatorByHandle,
  getCreatorStats,
  listCreatorPrompts,
} from "@/server/services/creator.service";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const creator = await getCreatorByHandle(handle);
  if (!creator) {
    return { title: "Creator not found", robots: { index: false } };
  }
  const stats = await getCreatorStats(creator.id);
  const displayName = creator.fullName ?? `@${creator.handle}`;
  const title = `${displayName} on ${SITE_BRAND.displayName}`;
  const description =
    creator.bio?.slice(0, 160) ??
    `${stats.promptCount} AI prompt${stats.promptCount === 1 ? "" : "s"} by ${displayName} — copied ${stats.totalCopies.toLocaleString()} times on ${SITE_BRAND.displayName}.`;
  const canonical = `https://${getSiteHostname()}/u/${creator.handle}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonical,
      siteName: SITE_BRAND.name,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: stats.promptCount > 0, follow: true },
  };
}

export const revalidate = 300;

export default async function CreatorProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const creator = await getCreatorByHandle(handle);
  if (!creator) notFound();

  const [stats, firstPage, contribStats] = await Promise.all([
    getCreatorStats(creator.id),
    listCreatorPrompts(creator.id, 1, 24),
    getContributorStats(creator.id),
  ]);

  const badges = getContributorBadges({
    promptCount: contribStats.promptCount,
    totalCopies: contribStats.totalCopies,
    rank: contribStats.rank,
  });

  const displayName = creator.fullName ?? `@${creator.handle}`;
  const initials = displayName
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal delay-1 mb-10 flex flex-col gap-5 border-b border-border pb-8 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4 md:gap-5">
            <Avatar className="size-16 shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background md:size-20">
              {creator.avatarUrl && (
                <AvatarImage src={creator.avatarUrl} alt={displayName} />
              )}
              <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary md:text-lg">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
                <UserIcon className="size-3" /> Creator
              </p>
              <h1 className="line-clamp-2 text-3xl font-bold tracking-[-0.025em] md:text-4xl lg:text-[2.75rem]">
                {displayName}
              </h1>
              <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                @{creator.handle}
              </p>
              {creator.bio && (
                <p className="mt-3 max-w-prose text-[13.5px] leading-relaxed text-foreground/85">
                  {creator.bio}
                </p>
              )}
              {badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <BadgeChip key={b.id} badge={b} />
                  ))}
                </div>
              )}
              <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <CalendarIcon className="size-3" />
                Joined {formatRelativeTime(creator.createdAt)}
                {contribStats.rank && (
                  <>
                    <span aria-hidden className="text-muted-foreground/30">
                      ·
                    </span>
                    <Link
                      href="/contributors"
                      className="font-medium text-foreground transition-colors hover:text-primary"
                    >
                      Ranked #{contribStats.rank}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:max-w-[260px]">
            <StatCard label="Prompts" value={stats.promptCount} />
            <StatCard label="Copies" value={stats.totalCopies} />
          </dl>
        </header>

        {firstPage.results.length === 0 ? (
          <EmptyCreator displayName={displayName} />
        ) : (
          <LoadMorePromptGrid
            initialItems={firstPage.results}
            initialHasMore={firstPage.hasMore}
            fetchUrl={`/api/u/${encodeURIComponent(creator.handle)}/prompts`}
          />
        )}
      </div>
    </section>
  );
}

function BadgeChip({ badge }: { badge: ContributorBadge }) {
  const toneClass =
    badge.tone === "gold"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : badge.tone === "primary"
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-border bg-card/50 text-muted-foreground";
  return (
    <span
      title={badge.hint}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${toneClass}`}
    >
      {badge.label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-3">
      <p className="font-mono text-[20px] font-semibold tabular-nums leading-none text-foreground">
        {formatCount(value)}
      </p>
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function EmptyCreator({ displayName }: { displayName: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <SparklesIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">
        {displayName} hasn't published anything yet
      </h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Check back later — or explore prompts from other creators.
      </p>
      <Link
        href="/search"
        className="magnetic mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
      >
        Browse prompts <ArrowRightIcon className="size-3.5" />
      </Link>
    </div>
  );
}
