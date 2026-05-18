"use client";

import { ArrowRightIcon, ClockIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PromptCard } from "@/components/prompt/PromptCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PromptListItem } from "@/server/services/prompt.service";

interface Props {
  initial: PromptListItem[];
}

/**
 * Account → "Recently copied" section.
 *
 * Server fetches the initial list (account page is dynamic), then this
 * client wrapper handles the Clear history dialog without a full reload.
 */
export function RecentlyCopiedSection({ initial }: Props) {
  const [items, setItems] = useState<PromptListItem[]>(initial);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (items.length === 0) {
    return (
      <section className="reveal mb-8 rounded-xl border border-dashed border-border/60 bg-card/30 px-5 py-6 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <ClockIcon className="size-3.5" />
          <span className="text-[13px] font-semibold">Recently copied</span>
        </div>
        <p className="mt-1.5">
          Prompts you copy while signed in show up here so you can re-use them
          fast. Browse and start copying — your history stays for 30 days.
        </p>
        <Link
          href="/search"
          className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
        >
          Browse prompts <ArrowRightIcon className="size-3" />
        </Link>
      </section>
    );
  }

  async function clearAll() {
    setClearing(true);
    try {
      const res = await fetch("/api/account/recent-copies", {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Couldn't clear history");
        return;
      }
      setItems([]);
      setConfirmOpen(false);
      toast.success("Copy history cleared");
    } catch {
      toast.error("Network error");
    } finally {
      setClearing(false);
    }
  }

  return (
    <section className="reveal mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
            <ClockIcon className="size-3" />
            For you
          </p>
          <h2 className="text-[1.125rem] font-bold tracking-[-0.02em] md:text-[1.25rem]">
            Recently copied
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {items.length} {items.length === 1 ? "prompt" : "prompts"} from the last 30 days
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          data-icon="inline-start"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="size-3.5" />
          Clear history
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => (
          <PromptCard
            key={p.id}
            prompt={p}
            unoptimizedImage={
              p.primaryImage?.cdnUrl.includes("picsum.photos") ?? false
            }
          />
        ))}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear copy history?</DialogTitle>
            <DialogDescription>
              This removes all rows from your personal timeline. The prompts
              themselves stay in the catalog — only your history clears.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={clearing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={clearAll}
              disabled={clearing}
            >
              {clearing ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                "Clear history"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
