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
      <div className="flex flex-col gap-4 border-b border-border/50 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Your work</p>
          <h2 className="text-[15px] font-semibold tracking-[-0.005em] md:text-base">
            My prompts
          </h2>
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Private prompts are link-only. Public prompts appear in search and
            browse after review.
          </p>
        </div>
        <Button
          asChild
          className="press h-9 shrink-0 gap-1.5 rounded-md px-3 text-[13px]"
        >
          <Link href="/submit">
            <PlusIcon className="size-3.5" />
            New prompt
          </Link>
        </Button>
      </div>

      {prompts.length > 0 && (
        <div
          className="mt-5 flex flex-wrap gap-1.5"
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
              className={`press inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
                filter === key
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {label}
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                  filter === key ? "bg-primary/15" : "bg-muted/60"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {prompts.length === 0 ? (
          <EmptyPrompts />
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/20 py-10 text-center text-[13px] text-muted-foreground">
            No {filter} prompts yet.
          </p>
        ) : (
          <ul className="space-y-3">
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
    <li className="group overflow-hidden rounded-xl border border-border/60 bg-card/50 shadow-soft transition-colors hover:border-border hover:bg-card/80">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isPrivate ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                <LockIcon className="size-2.5" />
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <GlobeIcon className="size-2.5" />
                Public
              </span>
            )}
            {p.status === "hidden" && (
              <span className="rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Hidden
              </span>
            )}
          </div>

          <h3 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-foreground group-hover:text-primary">
            {p.title}
          </h3>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
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

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
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
        <div className="border-t border-border/40 bg-muted/20 px-4 py-3 sm:px-5">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Link2Icon className="size-3" />
            Share link
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              readOnly
              value={p.shareUrl}
              className="h-9 flex-1 font-mono text-[11px] text-muted-foreground"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 gap-1.5 text-[12px]"
                disabled={busy}
                onClick={() => onCopy(p.shareUrl!)}
              >
                <CopyIcon className="size-3.5" />
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-[12px]"
                disabled={busy}
                onClick={() => onRegenerate(p.id)}
              >
                <RefreshCwIcon className="size-3.5" />
                New link
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 text-[12px]"
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-20 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <SparklesIcon className="size-6" strokeWidth={2} />
      </div>
      <h3 className="text-[16px] font-semibold">No prompts yet</h3>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Submit a private prompt for an instant share link, or go public to reach
        everyone on My Copyprompt.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/submit"
          className="magnetic inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
        >
          <PlusIcon className="size-3.5" />
          Create a prompt
        </Link>
        <Link
          href="/search"
          className="press inline-flex h-10 items-center rounded-md border border-border bg-card px-5 text-[13px] font-medium transition-all hover:border-foreground/30 hover:bg-muted"
        >
          Browse prompts
        </Link>
      </div>
    </div>
  );
}
