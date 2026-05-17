"use client";

import { HeartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { toast } from "sonner";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { createClient } from "@/lib/supabase-client";

interface HeartButtonProps {
  promptId: string;
  /**
   * Optional first-paint placeholder used only until the
   * `FavoritesProvider` finishes its single batch fetch. Once the
   * context is loaded it always wins, so toggling stays in sync across
   * every card on the page (including `/favorites`, where this prop is
   * set to `true` for the initial render).
   */
  initialFavorited?: boolean;
  className?: string;
}

/**
 * Save / favorite toggle.
 *
 * ─ State strategy ────────────────────────────────────────────
 * Reads from the app-wide `FavoritesProvider` so N hearts on a grid
 * share ONE network request instead of firing N. Cross-card sync is
 * automatic: toggling one heart updates every card showing the same
 * prompt.
 *
 * ─ Behavior ──────────────────────────────────────────────────
 *   - Auth-gated → routes to /signin?next=<here> when signed-out
 *   - Persists via /api/favorites/[promptId] (POST add / DELETE remove)
 *   - Optimistic UI: state flips immediately, reverts on error
 */
export function HeartButton({
  promptId,
  initialFavorited,
  className,
}: HeartButtonProps) {
  const router = useRouter();
  const { has, setFavorited, loaded } = useFavorites();
  const [animating, setAnimating] = useState(false);
  const [pending, setPending] = useState(false);

  // Once the context is loaded it is the single source of truth — the
  // SSR-provided `initialFavorited` only matters for the brief moment
  // before `/api/favorites/me` resolves, to avoid an unfilled flash.
  const saved = loaded ? has(promptId) : (initialFavorited ?? false);

  async function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (pending) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      toast("Sign in to save favorites");
      router.push(`/signin?next=${next}`);
      return;
    }

    const willBeSaved = !saved;
    setFavorited(promptId, willBeSaved);
    setAnimating(true);
    setPending(true);
    setTimeout(() => setAnimating(false), 400);

    try {
      const res = await fetch(`/api/favorites/${promptId}`, {
        method: willBeSaved ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setFavorited(promptId, !willBeSaved);
        toast.error(
          willBeSaved
            ? "Couldn't save favorite. Try again."
            : "Couldn't remove favorite. Try again.",
        );
        return;
      }
      toast.success(
        willBeSaved ? "Saved to favorites" : "Removed from favorites",
      );
    } catch {
      setFavorited(promptId, !willBeSaved);
      toast.error("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  const baseClass =
    className ??
    "press grid size-8 place-items-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 hover:text-primary";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={saved}
      disabled={pending}
      className={`${baseClass} disabled:cursor-wait`}
    >
      <HeartIcon
        className={`size-3.5 transition-all duration-250 ${
          saved ? "fill-primary stroke-primary" : ""
        } ${animating ? "animate-heart-pop" : ""}`}
        strokeWidth={1.8}
      />
    </button>
  );
}
