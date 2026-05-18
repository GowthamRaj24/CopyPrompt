"use client";

import { ExternalLinkIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminCollectionRow } from "@/server/services/collection.service";

interface Props {
  initial: AdminCollectionRow[];
}

export function AdminCollectionsTable({ initial }: Props) {
  const [items, setItems] = useState<AdminCollectionRow[]>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggleCurated(c: AdminCollectionRow) {
    setPendingId(c.id);
    try {
      const res = await fetch(`/api/admin/collections/${c.id}/curated`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurated: !c.isCurated }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Couldn't update");
        return;
      }
      setItems((prev) =>
        prev.map((row) =>
          row.id === c.id ? { ...row, isCurated: !c.isCurated } : row,
        ),
      );
      toast.success(
        !c.isCurated ? "Marked as curated" : "Removed from curated",
      );
    } catch {
      toast.error("Network error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60">
      <table className="w-full text-[13px]">
        <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Collection</th>
            <th className="px-4 py-2.5 text-left font-medium">Owner</th>
            <th className="px-4 py-2.5 text-right font-medium">Prompts</th>
            <th className="px-4 py-2.5 text-center font-medium">Curated</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map((c) => {
            const pending = pendingId === c.id;
            return (
              <tr key={c.id} className="hover:bg-muted/20">
                <td className="max-w-[260px] truncate px-4 py-3">
                  <span className="font-semibold tracking-[-0.01em]">
                    {c.name}
                  </span>
                  {c.description && (
                    <span className="ml-2 truncate text-[11px] text-muted-foreground">
                      {c.description}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.ownerHandle ? (
                    <Link
                      href={`/u/${c.ownerHandle}`}
                      className="hover:text-foreground"
                    >
                      @{c.ownerHandle}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {c.promptCount}
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    type="button"
                    size="xs"
                    variant={c.isCurated ? "default" : "outline"}
                    onClick={() => toggleCurated(c)}
                    disabled={pending}
                    data-icon="inline-start"
                  >
                    {pending ? (
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      <SparklesIcon className="size-3" />
                    )}
                    {c.isCurated ? "Curated" : "Mark curated"}
                  </Button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/c/${c.slug}`}
                    target="_blank"
                    className="press inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    Preview
                    <ExternalLinkIcon className="size-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
