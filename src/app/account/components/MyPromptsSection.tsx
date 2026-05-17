"use client";

import {
  ArrowUpRightIcon,
  CopyIcon,
  GlobeIcon,
  Link2Icon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/format";

export interface MyPromptItem {
  id: string;
  title: string;
  slug: string;
  visibility: "public" | "private";
  status: string;
  copyCount: number;
  createdAt: string;
  shareUrl: string | null;
  publicUrl: string | null;
}

type Filter = "all" | "private" | "public";

export function MyPromptsSection({
  initialPrompts,
}: {
  initialPrompts: MyPromptItem[];
}) {
  const router = useRouter();
  const [prompts, setPrompts] = useState(initialPrompts);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return prompts;
    return prompts.filter((p) => p.visibility === filter);
  }, [prompts, filter]);

  const counts = useMemo(
    () => ({
      all: prompts.length,
      private: prompts.filter((p) => p.visibility === "private").length,
      public: prompts.filter((p) => p.visibility === "public").length,
    }),
    [prompts],
  );

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy — select the link and copy manually");
    }
  }

  async function regenerate(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/account/prompts/${id}/regenerate-token`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, shareUrl: data.shareUrl as string } : p,
        ),
      );
      toast.success("New share link created", {
        description: "The previous link no longer works.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not regenerate");
    } finally {
      setBusyId(null);
    }
  }

  async function publish(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/account/prompts/${id}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                visibility: "public" as const,
                shareUrl: null,
                publicUrl: data.url as string,
              }
            : p,
        ),
      );
      toast.success("Now live in the public catalog");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section id="my-prompts" className="scroll-mt-24">
      <div className="flex flex-col gap-5 border-b border-border/50 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div>
          <p className="eyebrow mb-2 text-sm tracking-widest">Your work</p>
          <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
            My prompts
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Private prompts are link-only and never appear in search. Public
            prompts go live in the catalog after review.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="press h-12 shrink-0 gap-2 rounded-xl px-6 text-base font-semibold"
        >
          <Link href="/submit">
            <PlusIcon className="size-5" />
            New prompt
          </Link>
        </Button>
      </div>

      {prompts.length > 0 && (
        <div
          className="mt-6 flex flex-wrap gap-2 sm:mt-8"
          role="tablist"
          aria-label="Filter prompts"
        >
          {(
            [
              { key: "all" as const, label: "All" },
              { key: "private" as const, label: "Private" },
              { key: "public" as const, label: "Public" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`press inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors sm:h-12 sm:px-5 sm:text-base ${
                filter === key
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {label}
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-xs sm:text-sm ${
                  filter === key ? "bg-primary/15" : "bg-muted/60"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 sm:mt-10">
        {prompts.length === 0 ? (
          <EmptyPrompts />
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-card/20 py-16 text-center text-base text-muted-foreground sm:text-lg">
            No {filter} prompts yet.
          </p>
        ) : (
          <ul className="space-y-4 sm:space-y-5">
            {filtered.map((p) => (
              <PromptRow
                key={p.id}
                prompt={p}
                busy={busyId === p.id}
                onCopy={copyUrl}
                onRegenerate={regenerate}
                onPublish={publish}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PromptRow({
  prompt: p,
  busy,
  onCopy,
  onRegenerate,
  onPublish,
}: {
  prompt: MyPromptItem;
  busy: boolean;
  onCopy: (url: string) => void;
  onRegenerate: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  const isPrivate = p.visibility === "private";
  const created = new Date(p.createdAt);

  return (
    <li className="group overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-soft transition-colors hover:border-primary/20 hover:bg-card/80">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6 lg:p-7">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {isPrivate ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400 sm:text-sm">
                <LockIcon className="size-3.5" />
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 sm:text-sm">
                <GlobeIcon className="size-3.5" />
                Public
              </span>
            )}
            {p.status === "hidden" && (
              <span className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:text-sm">
                Hidden
              </span>
            )}
          </div>

          <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary sm:text-xl lg:text-2xl">
            {p.title}
          </h3>

          <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground sm:text-base">
            <span>{formatRelativeTime(created)}</span>
            <span aria-hidden className="text-border">
              ·
            </span>
            <span>
              <span className="font-semibold text-foreground">
                {p.copyCount.toLocaleString()}
              </span>{" "}
              copies
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2.5 sm:flex-col sm:items-stretch">
          {p.publicUrl && (
            <Button
              variant="outline"
              className="h-11 gap-2 text-sm sm:h-12 sm:text-base"
              asChild
            >
              <Link
                href={p.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
                <ArrowUpRightIcon className="size-4 opacity-60" />
              </Link>
            </Button>
          )}
          {p.shareUrl && (
            <Button
              variant="outline"
              className="h-11 gap-2 text-sm sm:h-12 sm:text-base"
              asChild
            >
              <Link href={p.shareUrl} target="_blank" rel="noopener noreferrer">
                Open link
                <ArrowUpRightIcon className="size-4 opacity-60" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {p.shareUrl && (
        <div className="border-t border-border/40 bg-muted/25 px-5 py-4 sm:px-6 sm:py-5 lg:px-7">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
            <Link2Icon className="size-4" />
            Share link
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              readOnly
              value={p.shareUrl}
              className="h-11 flex-1 font-mono text-sm text-muted-foreground sm:h-12 sm:text-base"
            />
            <div className="flex flex-wrap gap-2.5">
              <Button
                type="button"
                variant="secondary"
                className="h-11 gap-2 px-4 text-sm sm:h-12 sm:text-base"
                disabled={busy}
                onClick={() => onCopy(p.shareUrl!)}
              >
                <CopyIcon className="size-4" />
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 px-4 text-sm sm:h-12 sm:text-base"
                disabled={busy}
                onClick={() => onRegenerate(p.id)}
              >
                <RefreshCwIcon className="size-4" />
                New link
              </Button>
              <Button
                type="button"
                className="h-11 px-4 text-sm sm:h-12 sm:text-base"
                disabled={busy}
                onClick={() => onPublish(p.id)}
              >
                Publish publicly
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function EmptyPrompts() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-gradient-to-b from-primary/[0.08] via-card/30 to-card/10 px-6 py-16 text-center sm:px-10 sm:py-20 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,oklch(0.66_0.21_270/0.14),transparent)]"
      />
      <div className="relative mx-auto max-w-2xl">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary sm:size-20">
          <SparklesIcon className="size-8 sm:size-9" strokeWidth={1.8} />
        </div>
        <h3 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl lg:text-4xl">
          No prompts yet
        </h3>
        <p className="mx-auto mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
          Create a private prompt for an instant share link, or submit publicly
          to reach everyone on My Copyprompt.
        </p>

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 sm:gap-5 lg:mt-10">
          <div className="rounded-xl border border-border/50 bg-card/50 p-5 sm:p-6">
            <div className="mb-2 flex items-center gap-2 text-violet-400">
              <LockIcon className="size-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Private
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Instant share link. Not listed in search or browse.
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/50 p-5 sm:p-6">
            <div className="mb-2 flex items-center gap-2 text-emerald-500">
              <GlobeIcon className="size-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Public
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Reviewed and published to the catalog for everyone to discover.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 rounded-xl px-6 text-base font-semibold sm:h-14 sm:px-8 sm:text-lg"
          >
            <Link href="/submit">
              <PlusIcon className="size-5" />
              Create a prompt
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            size="lg"
            className="h-12 rounded-xl px-6 text-base sm:h-14 sm:px-8 sm:text-lg"
          >
            <Link href="/search">Browse prompts</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
