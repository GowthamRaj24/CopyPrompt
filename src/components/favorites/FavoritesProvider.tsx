"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * FavoritesProvider
 * ─────────────────
 * Single source of truth for the current user's favorited prompt ids.
 *
 * Why this exists
 * ───────────────
 * Before this provider, every `HeartButton` on the page had to either
 *   (a) receive its `initialFavorited` from a server-side
 *       `getUserFavoriteIds()` query — which forced every public page
 *       into `force-dynamic` rendering, OR
 *   (b) fire its OWN `GET /api/favorites/[id]` request on mount, which
 *       multiplied to N HTTP requests for an N-card grid.
 *
 * Both paths burned latency and broke caching. This provider does the
 * favorite-state lookup ONCE per browser tab via `GET /api/favorites/me`,
 * stores the result in a React `Set`, and lets every `HeartButton`
 * subscribe via `useFavorites()`.
 *
 * Pages now render statically (or with `revalidate`) because they no
 * longer need to know who the visitor is at render time.
 *
 * Performance contract
 * ────────────────────
 *   - 1 network request per page load, regardless of how many cards
 *   - No re-fetch on route changes — React state survives client nav
 *   - Optimistic toggle: state updates instantly, reverts on API error
 */

interface FavoritesContextValue {
  /** Has the initial fetch completed? */
  loaded: boolean;
  /** Whether this prompt is in the user's favorites */
  has: (promptId: string) => boolean;
  /** Optimistically set the favorited state for a prompt */
  setFavorited: (promptId: string, value: boolean) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/favorites/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setLoaded(true);
          return;
        }
        const data = (await res.json()) as { ids?: string[] };
        if (!cancelled) {
          setIds(new Set(data.ids ?? []));
          setLoaded(true);
        }
      } catch {
        // Silent — unauthenticated visitors and network errors both
        // resolve to "no favorites", which is the correct default.
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const has = useCallback((promptId: string) => ids.has(promptId), [ids]);

  const setFavorited = useCallback(
    (promptId: string, value: boolean) => {
      setIds((prev) => {
        const isAlreadySet = prev.has(promptId);
        if (value === isAlreadySet) return prev;
        const next = new Set(prev);
        if (value) next.add(promptId);
        else next.delete(promptId);
        return next;
      });
    },
    [],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ loaded, has, setFavorited }),
    [loaded, has, setFavorited],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

/**
 * Subscribe to the user's favorites set.
 *
 * Safe to call from any client component. When called outside of a
 * provider (shouldn't happen in app routes, but during isolated
 * Storybook-style renders) returns a no-op shape so HeartButtons
 * still render without crashing.
 */
export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    return {
      loaded: false,
      has: () => false,
      setFavorited: () => {},
    };
  }
  return ctx;
}
