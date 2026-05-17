"use client";

import { Loader2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PendingSubmissionListItem } from "@/server/services/admin.service";
import { SubmissionCard } from "./SubmissionCard";

interface QueueLoadMoreProps {
  initialItems: PendingSubmissionListItem[];
  initialHasMore: boolean;
  status: "pending" | "approved" | "rejected";
  showActions: boolean;
}

export function QueueLoadMore({
  initialItems,
  initialHasMore,
  status,
  showActions,
}: QueueLoadMoreProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/admin/queue?status=${status}&page=${nextPage}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as {
        items: PendingSubmissionListItem[];
        hasMore: boolean;
      };
      setItems((prev) => [...prev, ...(data.items ?? [])]);
      setPage(nextPage);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, status]);

  return (
    <>
      <div className="space-y-4">
        {items.map((s) => (
          <SubmissionCard
            key={s.id}
            id={s.id}
            promptData={s.promptData}
            email={s.email}
            createdAt={s.createdAt}
            showActions={showActions}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center border-t border-border/40 pt-6">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void loadMore()}
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Loading…
              </>
            ) : (
              "Load more submissions"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
