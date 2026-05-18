import { ArrowRightIcon, TrophyIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCount } from "@/lib/format";
import { SITE_BRAND, getSiteHostname } from "@/lib/site-brand";
import { listContributorLeaderboard } from "@/server/services/contributor.service";

export const metadata: Metadata = {
  title: "Top contributors",
  description: `The creators behind the most-copied prompts on ${SITE_BRAND.displayName}.`,
  alternates: {
    canonical: `https://${getSiteHostname()}/contributors`,
  },
  openGraph: {
    title: `Top contributors on ${SITE_BRAND.displayName}`,
    description: `The creators behind the most-copied prompts on ${SITE_BRAND.displayName}.`,
    type: "website",
    siteName: SITE_BRAND.name,
  },
};

export const revalidate = 600;

async function safeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[contributors] ${label} failed:`, err);
    return fallback;
  }
}

export default async function ContributorsPage() {
  // Wrapped so a pending migration (users.handle / total_copies_received
  // missing on the deployed DB) renders an empty state instead of
  // failing the static export.
  const entries = await safeQuery(
    "leaderboard",
    () => listContributorLeaderboard(50),
    [] as Awaited<ReturnType<typeof listContributorLeaderboard>>,
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
            <TrophyIcon className="size-3" />
            Leaderboard
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.025em] md:text-5xl">
            Top contributors
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            The creators whose prompts get copied the most. Ranked by total
            copies across all approved prompts.
          </p>
        </header>

        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <ol className="reveal delay-2 divide-y divide-border/40 rounded-xl border border-border/60 bg-card/60">
            {entries.map((entry) => (
              <li key={entry.id}>
                <LeaderboardRow entry={entry} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function LeaderboardRow({
  entry,
}: {
  entry: Awaited<ReturnType<typeof listContributorLeaderboard>>[number];
}) {
  const displayName = entry.fullName ?? `@${entry.handle}`;
  const initials = displayName
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <Link
      href={`/u/${entry.handle}`}
      className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/20 sm:px-5"
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-semibold tabular-nums ${
          entry.rank === 1
            ? "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30"
            : entry.rank === 2
              ? "bg-zinc-400/15 text-zinc-300 ring-1 ring-zinc-400/30"
              : entry.rank === 3
                ? "bg-orange-700/15 text-orange-400 ring-1 ring-orange-700/30"
                : "bg-muted/60 text-muted-foreground"
        }`}
      >
        {entry.rank}
      </span>
      <Avatar className="size-10 shrink-0 ring-1 ring-border/60">
        {entry.avatarUrl && (
          <AvatarImage src={entry.avatarUrl} alt={displayName} />
        )}
        <AvatarFallback className="bg-primary/10 text-[12px] font-semibold text-primary">
          {initials || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[14px] font-semibold tracking-[-0.01em] transition-colors group-hover:text-primary">
          {displayName}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          @{entry.handle}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="font-mono text-[16px] font-semibold tabular-nums">
          {formatCount(entry.totalCopies)}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          copies
        </p>
      </div>
      <div className="hidden text-right md:block">
        <p className="font-mono text-[16px] font-semibold tabular-nums">
          {entry.promptCount.toLocaleString()}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          prompts
        </p>
      </div>
      <ArrowRightIcon
        className="size-3 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <TrophyIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">Nobody on the board yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Be the first to submit a prompt and stake your claim.
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
