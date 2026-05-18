"use client";

import {
  ArrowUpRightIcon,
  CopyIcon,
  GlobeIcon,
  Link2Icon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
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
      {prompts.length > 0 && (
        <>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Private prompts use a share link only. Public prompts appear in
            search after review.
          </p>
          <div
            className="mt-4 flex flex-wrap gap-1.5"
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
                className={`press inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-colors ${
                  filter === key
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/50 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {label}
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    filter === key ? "bg-primary/15" : "bg-muted/50"
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className={prompts.length > 0 ? "mt-5" : ""}>
        {prompts.length === 0 ? (
          <EmptyPrompts />
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/30 py-12 text-center text-[13px] text-muted-foreground">
            No {filter} prompts yet.
          </p>
        ) : (
          <ul className="space-y-2.5">
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
    <li className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft transition-colors hover:border-border">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isPrivate ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-400">
                <LockIcon className="size-2.5" />
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <GlobeIcon className="size-2.5" />
                Public
              </span>
            )}
            {p.status === "hidden" && (
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                Hidden
              </span>
            )}
          </div>

          <h3 className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug tracking-[-0.02em] text-foreground group-hover:text-primary">
            {p.title}
          </h3>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
            <span>{formatRelativeTime(created)}</span>
            <span aria-hidden className="text-border">
              ·
            </span>
            <span>
              <span className="font-medium text-foreground">
                {p.copyCount.toLocaleString()}
              </span>{" "}
              copies
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5 sm:flex-col">
          {p.publicUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-[12px]"
              asChild
            >
              <Link
                href={p.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
                <ArrowUpRightIcon className="size-3 opacity-60" />
              </Link>
            </Button>
          )}
          {p.shareUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-[12px]"
              asChild
            >
              <Link href={p.shareUrl} target="_blank" rel="noopener noreferrer">
                Open link
                <ArrowUpRightIcon className="size-3 opacity-60" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {p.shareUrl && (
        <div className="border-t border-border/40 bg-muted/15 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Link2Icon className="size-3" />
            Share link
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              readOnly
              value={p.shareUrl}
              className="h-8 flex-1 border-border/50 bg-background/80 font-mono text-[11px] text-muted-foreground"
            />
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-1 text-[12px]"
                disabled={busy}
                onClick={() => onCopy(p.shareUrl!)}
              >
                <CopyIcon className="size-3" />
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-[12px]"
                disabled={busy}
                onClick={() => onRegenerate(p.id)}
              >
                <RefreshCwIcon className="size-3" />
                New link
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 text-[12px]"
                disabled={busy}
                onClick={() => onPublish(p.id)}
              >
                Publish
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center sm:py-20">
      <div className="mb-4 grid size-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <SparklesIcon className="size-5" strokeWidth={2} />
      </div>
      <h2 className="text-[15px] font-semibold tracking-[-0.02em]">
        No prompts yet
      </h2>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        Start with a private prompt for an instant share link, or submit to the
        public catalog.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/submit"
          className="magnetic inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
        >
          <PlusIcon className="size-3.5" />
          Create a prompt
        </Link>
        <Link
          href="/search"
          className="press inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-[13px] font-medium transition-all hover:border-foreground/30 hover:bg-muted"
        >
          <SearchIcon className="size-3.5" />
          Browse prompts
        </Link>
      </div>
    </div>
  );
}
