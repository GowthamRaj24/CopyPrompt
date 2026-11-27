"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppUser } from "@/server/lib/auth";

/**
 * CurrentUserProvider
 * ───────────────────
 * Client-side source of truth for "who is signed in", used by the header.
 *
 * The header used to resolve the user during the server render, which read
 * auth cookies in the root layout and forced every page to render
 * dynamically (no CDN caching anywhere). Now pages render without knowing
 * the visitor, and this provider asks `GET /api/auth/me` once per tab.
 *
 * Re-fetch triggers:
 *   - leaving an auth page (/signin, /signup, /reset-password …) — sign-in
 *     finishes with a client-side `router.push`, so the provider stays
 *     mounted and must notice the new session;
 *   - an explicit `refresh()` call.
 * Sign-out is a full-page form POST + redirect, which remounts everything.
 */

type Status = "loading" | "ready";

interface CurrentUserContextValue {
  user: AppUser | null;
  status: Status;
  refresh: () => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue>({
  user: null,
  status: "loading",
  refresh: () => {},
});

const AUTH_PATHS = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/",
];

function isAuthPath(pathname: string | null): boolean {
  return !!pathname && AUTH_PATHS.some((p) => pathname.startsWith(p));
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const requestId = useRef(0);

  const refresh = useCallback(() => {
    const id = ++requestId.current;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: AppUser | null }) => {
        if (id !== requestId.current) return; // a newer request superseded us
        setUser(data.user ?? null);
        setStatus("ready");
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setUser(null);
        setStatus("ready");
      });
  }, []);

  // Initial load.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-check after leaving an auth page (sign-in / password reset).
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;
    if (prev !== pathname && isAuthPath(prev) && !isAuthPath(pathname)) {
      refresh();
    }
  }, [pathname, refresh]);

  const value = useMemo(
    () => ({ user, status, refresh }),
    [user, status, refresh],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  return useContext(CurrentUserContext);
}
