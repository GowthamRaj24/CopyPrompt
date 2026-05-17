"use client";

import {
  ArrowUpRightIcon,
  GlobeIcon,
  LinkIcon,
  LockIcon,
  SparklesIcon,
} from "lucide-react";

export function VisibilityChoice({
  value,
  onChange,
}: {
  value: "public" | "private";
  onChange: (v: "public" | "private") => void;
}) {
  return (
    <div className="space-y-4">
      <div
        className="grid gap-3 lg:grid-cols-2"
        role="radiogroup"
        aria-label="How to distribute your prompt"
      >
        <DistributionCard
          selected={value === "public"}
          onSelect={() => onChange("public")}
          variant="public"
          icon={<GlobeIcon className="size-6" strokeWidth={1.75} />}
          headline="Public catalog"
          quote="Get discovered by thousands of creators."
          stats={[
            { label: "Reach", value: "Search & browse" },
            { label: "Timeline", value: "~24h review" },
            { label: "Cost", value: "Free exposure" },
          ]}
          cta="Built for growth"
        />
        <DistributionCard
          selected={value === "private"}
          onSelect={() => onChange("private")}
          variant="private"
          icon={<LockIcon className="size-6" strokeWidth={1.75} />}
          headline="Private link"
          quote="Your link. Your audience. Your rules."
          stats={[
            { label: "Access", value: "Link-only" },
            { label: "Timeline", value: "Instant" },
            { label: "Use case", value: "Clients & social" },
          ]}
          cta="Built for control"
        />
      </div>

      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
          value === "public"
            ? "border-emerald-500/25 bg-emerald-500/[0.07]"
            : "border-violet-500/25 bg-violet-500/[0.07]"
        }`}
      >
        {value === "public" ? (
          <SparklesIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        ) : (
          <LinkIcon className="mt-0.5 size-4 shrink-0 text-violet-400" />
        )}
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {value === "public" ? (
            <>
              <span className="font-medium text-foreground">
                We review, then publish.
              </span>{" "}
              Your prompt appears in search and browse — perfect when you want
              SEO, discovery, and community credit on My Copyprompt.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">
                Instant share link.
              </span>{" "}
              Not listed in search. Ideal for LinkedIn, client deliverables, paid
              packs, or drafts you&apos;re not ready to publish yet.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function DistributionCard({
  selected,
  onSelect,
  variant,
  icon,
  headline,
  quote,
  stats,
  cta,
}: {
  selected: boolean;
  onSelect: () => void;
  variant: "public" | "private";
  icon: React.ReactNode;
  headline: string;
  quote: string;
  stats: Array<{ label: string; value: string }>;
  cta: string;
}) {
  const isPublic = variant === "public";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all sm:p-6 ${
        selected
          ? isPublic
            ? "border-emerald-500/50 ring-2 ring-emerald-500/25"
            : "border-violet-500/50 ring-2 ring-violet-500/25"
          : "border-border/40 hover:border-border/80"
      }`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity ${
          selected ? "opacity-100" : "opacity-40 group-hover:opacity-60"
        } ${
          isPublic
            ? "bg-gradient-to-br from-emerald-500/20 via-transparent to-primary/10"
            : "bg-gradient-to-br from-violet-500/25 via-transparent to-primary/5"
        }`}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`grid size-12 place-items-center rounded-xl border ${
              isPublic
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-500"
                : "border-violet-500/30 bg-violet-500/15 text-violet-400"
            }`}
          >
            {icon}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
              isPublic
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-violet-500/15 text-violet-400"
            }`}
          >
            {cta}
            <ArrowUpRightIcon className="size-3" />
          </span>
        </div>

        <h3 className="mt-4 text-lg font-bold tracking-[-0.02em] text-foreground">
          {headline}
        </h3>
        <p
          className={`mt-1 text-[14px] font-medium italic leading-snug ${
            isPublic ? "text-emerald-600/90 dark:text-emerald-400/90" : "text-violet-400/90"
          }`}
        >
          &ldquo;{quote}&rdquo;
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-border/30 pt-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {s.label}
              </dt>
              <dd className="mt-0.5 text-[12px] font-semibold text-foreground">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </button>
  );
}
