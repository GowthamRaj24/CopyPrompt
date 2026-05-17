import {
  ActivityIcon,
  CopyIcon,
  EyeIcon,
  HeartIcon,
  ImageIcon,
  InboxIcon,
  MessageSquareIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Sparkline } from "@/components/charts/Sparkline";
import { loadAdminAnalyticsDashboard } from "@/server/services/analytics.service";

export const metadata: Metadata = {
  title: "Admin · Analytics",
  robots: { index: false, follow: false },
};

// Must stay dynamic (auth + live DB). Do not ISR-cache admin metrics.
export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const {
    totals,
    pulse,
    signupsSeries,
    submissionsSeries,
    favoritesSeries,
    topPrompts,
    topCategories,
    topTags,
    topModels,
  } = await loadAdminAnalyticsDashboard();

  return (
    <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-8 border-b border-border pb-6 md:mb-10">
        <p className="eyebrow mb-2">Admin · Analytics</p>
        <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
          What&apos;s happening
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Live numbers straight from the database. No third-party trackers,
          no sampling.
        </p>
      </header>

      {/* ── 24h pulse ─────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeader
          icon={<ActivityIcon className="size-4" />}
          title="Last 24 hours"
          subtitle="Fresh activity since yesterday"
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <PulseCard label="New users" value={pulse.newUsers24h} accent />
          <PulseCard label="Submissions" value={pulse.newSubmissions24h} />
          <PulseCard
            label="Approved"
            value={pulse.approvedPrompts24h}
          />
          <PulseCard label="Favorites" value={pulse.newFavorites24h} />
          <PulseCard label="Ratings" value={pulse.newRatings24h} />
        </div>
      </section>

      {/* ── Totals overview ───────────────────────────── */}
      <section className="mb-10">
        <SectionHeader
          icon={<SparklesIcon className="size-4" />}
          title="All-time totals"
          subtitle="Lifetime numbers across the platform"
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <BigStat
            icon={<SparklesIcon className="size-4" />}
            label="Published prompts"
            value={totals.publishedPrompts}
            sub={`${totals.prompts.toLocaleString()} total`}
          />
          <BigStat
            icon={<UsersIcon className="size-4" />}
            label="Users"
            value={totals.users}
          />
          <BigStat
            icon={<InboxIcon className="size-4" />}
            label="Submissions"
            value={totals.submissions}
            sub={`${totals.pendingSubmissions.toLocaleString()} pending`}
            highlightSub={totals.pendingSubmissions > 0}
          />
          <BigStat
            icon={<HeartIcon className="size-4" />}
            label="Favorites"
            value={totals.favorites}
          />
          <BigStat
            icon={<CopyIcon className="size-4" />}
            label="Total copies"
            value={totals.totalCopies}
          />
          <BigStat
            icon={<EyeIcon className="size-4" />}
            label="Total views"
            value={totals.totalViews}
          />
          <BigStat
            icon={<StarIcon className="size-4" />}
            label="Ratings"
            value={totals.ratings}
          />
        </div>
      </section>

      {/* ── 30-day trends ─────────────────────────────── */}
      <section className="mb-10">
        <SectionHeader
          icon={<TrendingUpIcon className="size-4" />}
          title="30-day trends"
          subtitle="Daily counts. Hover the numbers below each chart for the peak day."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <TrendCard
            label="Signups"
            data={signupsSeries.map((p) => p.count)}
            sumLabel={`${sum(signupsSeries.map((p) => p.count)).toLocaleString()} in 30d`}
            color="oklch(0.66 0.21 270)"
          />
          <TrendCard
            label="Submissions"
            data={submissionsSeries.map((p) => p.count)}
            sumLabel={`${sum(submissionsSeries.map((p) => p.count)).toLocaleString()} in 30d`}
            color="oklch(0.7 0.18 160)"
          />
          <TrendCard
            label="Favorites"
            data={favoritesSeries.map((p) => p.count)}
            sumLabel={`${sum(favoritesSeries.map((p) => p.count)).toLocaleString()} in 30d`}
            color="oklch(0.72 0.18 30)"
          />
        </div>
      </section>

      {/* ── Top prompts ───────────────────────────────── */}
      <section className="mb-10">
        <SectionHeader
          icon={<TrendingUpIcon className="size-4" />}
          title="Top prompts by copies"
          subtitle="What people are actually using"
        />
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Prompt</th>
                <th className="px-4 py-2 font-medium">Model</th>
                <th className="px-4 py-2 text-right font-medium">Copies</th>
                <th className="px-4 py-2 text-right font-medium">Views</th>
                <th className="px-4 py-2 text-right font-medium">Net votes</th>
              </tr>
            </thead>
            <tbody>
              {topPrompts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No prompts yet.
                  </td>
                </tr>
              ) : (
                topPrompts.map((p, idx) => {
                  const net = p.upvotes - p.downvotes;
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-border/60 hover:bg-muted/30"
                    >
                      <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/prompt/${p.slug}`}
                          target="_blank"
                          className="line-clamp-1 font-medium hover:text-primary"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          {p.modelType === "image" ? (
                            <ImageIcon className="size-3" />
                          ) : (
                            <MessageSquareIcon className="size-3" />
                          )}
                          {p.modelName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                        {p.copyCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {p.viewCount.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right tabular-nums ${
                          net > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : net < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}
                      >
                        {net > 0 ? `+${net}` : net}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Categories + Tags + Models ────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <LeaderboardCard
          icon={<SparklesIcon className="size-4" />}
          title="Top categories"
        >
          {topCategories.length === 0 ? (
            <EmptyRow text="No categories yet." />
          ) : (
            topCategories.map((c) => (
              <LeaderboardRow
                key={c.slug}
                label={c.name}
                href={`/category/${c.slug}`}
                value={c.promptCount}
                hint={`${c.totalCopies.toLocaleString()} copies`}
              />
            ))
          )}
        </LeaderboardCard>

        <LeaderboardCard
          icon={<TagIcon className="size-4" />}
          title="Top tags"
        >
          {topTags.length === 0 ? (
            <EmptyRow text="No tags yet." />
          ) : (
            topTags.map((t) => (
              <LeaderboardRow
                key={t.slug}
                label={`#${t.name}`}
                value={t.usageCount}
              />
            ))
          )}
        </LeaderboardCard>

        <LeaderboardCard
          icon={<SparklesIcon className="size-4" />}
          title="Top models"
        >
          {topModels.length === 0 ? (
            <EmptyRow text="No models yet." />
          ) : (
            topModels.map((m) => (
              <LeaderboardRow
                key={m.slug}
                label={m.name}
                value={m.promptCount}
                hint={m.type === "image" ? "image" : "text"}
              />
            ))
          )}
        </LeaderboardCard>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tiny presentational helpers (kept in-file to avoid file sprawl)
   ═══════════════════════════════════════════════════════════════ */

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <p className="mt-1.5 text-[13px] text-muted-foreground/80">{subtitle}</p>
    </div>
  );
}

function PulseCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-primary/40 bg-primary/[0.06]"
          : "border-border bg-card"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-bold tabular-nums tracking-[-0.02em] ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function BigStat({
  icon,
  label,
  value,
  sub,
  highlightSub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  highlightSub?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-[-0.02em]">
        {value.toLocaleString()}
      </p>
      {sub && (
        <p
          className={`mt-0.5 text-[12px] ${
            highlightSub ? "font-medium text-primary" : "text-muted-foreground"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function TrendCard({
  label,
  data,
  sumLabel,
  color,
}: {
  label: string;
  data: number[];
  sumLabel: string;
  color: string;
}) {
  const peak = Math.max(...data, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[12.5px] font-medium text-foreground">{label}</p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          peak {peak.toLocaleString()}
        </p>
      </div>
      <div className="mt-3" style={{ color }}>
        <Sparkline
          data={data}
          width={300}
          height={56}
          className="w-full"
          ariaLabel={`${label} over the last 30 days`}
        />
      </div>
      <p className="mt-2 text-[12px] tabular-nums text-muted-foreground">
        {sumLabel}
      </p>
    </div>
  );
}

function LeaderboardCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

function LeaderboardRow({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-muted/30">
      <div className="flex min-w-0 flex-col">
        <span className="line-clamp-1 font-medium text-foreground">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {value.toLocaleString()}
      </span>
    </div>
  );
  return href ? (
    <Link href={href} target="_blank">
      {body}
    </Link>
  ) : (
    body
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
      {text}
    </div>
  );
}
