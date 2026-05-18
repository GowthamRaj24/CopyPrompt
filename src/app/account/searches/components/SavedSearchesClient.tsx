"use client";

import {
  BellIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildSearchHref,
  describeSavedSearch,
  type SavedSearchRow,
} from "@/lib/saved-search-shared";

interface Props {
  initial: SavedSearchRow[];
}

export function SavedSearchesClient({ initial }: Props) {
  const [items, setItems] = useState<SavedSearchRow[]>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function remove(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/saved-searches/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Couldn't delete alert");
        return;
      }
      setItems((prev) => prev.filter((s) => s.id !== id));
      toast.success("Alert removed");
    } catch {
      toast.error("Network error");
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) return null;

  return (
    <ul className="reveal delay-2 divide-y divide-border/40 rounded-xl border border-border/60 bg-card/60">
      {items.map((s) => {
        const href = buildSearchHref(s);
        const subtitle = describeSavedSearch(s);
        const pending = pendingId === s.id;
        return (
          <li key={s.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <BellIcon className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={href}
                className="line-clamp-1 text-[14px] font-semibold tracking-[-0.01em] text-foreground hover:text-primary"
              >
                {s.label}
              </Link>
              <p className="line-clamp-1 text-[11.5px] text-muted-foreground">
                {subtitle}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void remove(s.id)}
              disabled={pending}
              className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete ${s.label}`}
            >
              {pending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <Trash2Icon className="size-3.5" />
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
