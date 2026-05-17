"use client";

import { Loader2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PromptListItem } from "@/server/services/prompt.service";
import { PromptCard } from "./PromptCard";

interface LoadMorePromptGridProps {
  initialItems: PromptListItem[];
  initialHasMore: boolean;
  fetchUrl: string;
  /** Base index for ranking badges (page 1 starts at 1). */
  indexOffset?: number;
  gridClassName?: string;
  /** When true, hearts render filled (favorites page). */
  allFavorited?: boolean;
}

/**
 * Server-rendered first page + client "Load more" for fewer round-trips
 * than full page navigations.
 */
export function LoadMorePromptGrid({
  initialItems,
  initialHasMore,
  fetchUrl,
  indexOffset = 0,
  gridClassName = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  allFavorited = false,
}: LoadMorePromptGridProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const separator = fetchUrl.includes("?") ? "&" : "?";
      const res = await fetch(`${fetchUrl}${separator}page=${nextPage}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to load more prompts");
      }
      const data = (await res.json()) as {
        results: PromptListItem[];
        hasMore: boolean;
      };
      setItems((prev) => [...prev, ...(data.results ?? [])]);
      setPage(nextPage);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Could not load more. Try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, hasMore, loading, page]);

  return (
    <>
      <div className={gridClassName}>
        {items.map((p, idx) => (
          <PromptCard
            key={p.id}
            prompt={p}
            index={indexOffset + idx + 1}
            initialFavorited={allFavorited}
            unoptimizedImage={
              p.primaryImage?.cdnUrl.includes("picsum.photos") ?? false
            }
          />
        ))}
      </div>

      {(hasMore || loading) && (
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-border/40 pt-8">
          {error && (
            <p className="text-[13px] text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={loading || !hasMore}
            onClick={() => void loadMore()}
            className="min-w-[160px]"
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Loading…
              </>
            ) : (
              "Load more prompts"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
