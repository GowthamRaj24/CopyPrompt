"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Sonner ships ~12 KiB gzipped of JS that hydrates immediately on
 * mount, contributing to TBT on Lighthouse mobile runs. The toaster
 * itself isn't needed until the first toast() call (copy success,
 * error, etc.) — so we defer hydration to either:
 *   - first user interaction
 *   - the next idle frame (typically <1s in real users)
 *
 * If a toast() is called before we mount, it's enqueued by sonner's
 * own global queue and renders the moment we hydrate.
 */
const Sonner = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false },
);

interface DeferredToasterProps {
  richColors?: boolean;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
  toastOptions?: {
    classNames?: Record<string, string>;
  };
}

export function DeferredToaster(props: DeferredToasterProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };

    let cancelled = false;
    const trigger = () => {
      if (cancelled) return;
      cancelled = true;
      setReady(true);
    };

    // Real users almost always interact within a second; idle fallback
    // ensures we hydrate even for silent visits before any toast fires.
    const events: Array<keyof WindowEventMap> = [
      "scroll",
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    for (const e of events) {
      window.addEventListener(e, trigger, {
        once: true,
        passive: true,
      } as AddEventListenerOptions);
    }

    const idleId =
      win.requestIdleCallback?.(trigger, { timeout: 4_000 }) ??
      window.setTimeout(trigger, 4_000);

    return () => {
      cancelled = true;
      for (const e of events) window.removeEventListener(e, trigger);
      if (typeof idleId === "number") window.clearTimeout(idleId);
    };
  }, []);

  if (!ready) return null;
  return <Sonner {...props} />;
}
