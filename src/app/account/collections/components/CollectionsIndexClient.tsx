"use client";

import {
  EyeIcon,
  FolderIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CollectionListItem } from "@/server/services/collection.service";

interface Props {
  initial: CollectionListItem[];
}

/** Client wrapper so users can create boards inline and see updates. */
export function CollectionsIndexClient({ initial }: Props) {
  const [items, setItems] = useState<CollectionListItem[]>(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Couldn't create collection");
        return;
      }
      setItems((prev) => [data.collection, ...prev]);
      setName("");
      setOpen(false);
      toast.success("Collection created");
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="reveal delay-2 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          Free plan: up to 5 collections · 50 prompts each
        </p>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          data-icon="inline-start"
        >
          <PlusIcon className="size-3.5" />
          New collection
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <CollectionTile key={c.id} c={c} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>
              Give your board a name. You can rename it later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input
              autoFocus
              placeholder="e.g. Midjourney portraits"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              disabled={creating}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creating || name.trim().length === 0}
              >
                {creating ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollectionTile({ c }: { c: CollectionListItem }) {
  return (
    <Link
      href={`/account/collections/${c.id}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border/60 bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/50 bg-background/60 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary">
          <FolderIcon className="size-4" strokeWidth={2} />
        </div>
        <VisibilityBadge isPublic={c.isPublic} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[14px] font-semibold tracking-[-0.01em] transition-colors group-hover:text-primary">
          {c.name}
        </p>
        {c.description && (
          <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
            {c.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-border/30 pt-2.5 text-[11px] text-muted-foreground">
        <span className="font-mono tabular-nums">
          {c.promptCount} {c.promptCount === 1 ? "prompt" : "prompts"}
        </span>
      </div>
    </Link>
  );
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
        isPublic
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-background/80 text-muted-foreground"
      }`}
    >
      {isPublic ? (
        <EyeIcon className="size-2.5" strokeWidth={2.5} />
      ) : (
        <LockIcon className="size-2.5" strokeWidth={2.5} />
      )}
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <FolderIcon className="size-6" strokeWidth={2} />
      </div>
      <h2 className="text-[16px] font-semibold">No collections yet</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        Boards keep your prompts organized. Use the heart for quick saves; use
        collections when you want themes.
      </p>
    </div>
  );
}
