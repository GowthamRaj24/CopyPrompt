"use client";

import { CopyIcon, GlobeIcon, Link2Icon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface MyPromptItem {
  id: string;
  title: string;
  slug: string;
  visibility: "public" | "private";
  status: string;
  copyCount: number;
  shareUrl: string | null;
  publicUrl: string | null;
}

export function MyPromptsClient({
  initialPrompts,
}: {
  initialPrompts: MyPromptItem[];
}) {
  const router = useRouter();
  const [prompts, setPrompts] = useState(initialPrompts);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
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
      toast.success("New link generated — old link no longer works");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
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
      toast.success("Published to catalog");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (prompts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 py-12 text-center text-[14px] text-muted-foreground">
        No prompts yet.{" "}
        <Link href="/submit" className="font-medium text-primary hover:underline">
          Submit your first prompt
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {prompts.map((p) => (
        <li
          key={p.id}
          className="rounded-xl border border-border bg-card/40 p-4 shadow-soft"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-[15px] font-semibold tracking-[-0.01em]">
                {p.title}
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {p.visibility === "private" ? (
                  <span className="inline-flex items-center gap-1">
                    <Link2Icon className="size-3" />
                    Private · {p.copyCount} copies
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <GlobeIcon className="size-3" />
                    Public · {p.copyCount} copies
                  </span>
                )}
                {p.status === "hidden" && " · Hidden"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {p.shareUrl && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-[12px]"
                  disabled={busyId === p.id}
                  onClick={() => void copyUrl(p.shareUrl!)}
                >
                  <CopyIcon className="size-3" />
                  Copy link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-[12px]"
                  disabled={busyId === p.id}
                  onClick={() => void regenerate(p.id)}
                >
                  <RefreshCwIcon className="size-3" />
                  New link
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-[12px]"
                  disabled={busyId === p.id}
                  onClick={() => void publish(p.id)}
                >
                  Publish to catalog
                </Button>
              </>
            )}
            {p.publicUrl && (
              <Button variant="outline" size="sm" className="h-8 text-[12px]" asChild>
                <Link href={p.publicUrl}>View public page</Link>
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
