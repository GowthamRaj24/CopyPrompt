"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => m.Analytics),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false },
);

/**
 * Vercel Analytics + Speed Insights — deferred to idle.
 *
 * These telemetry bundles aren't part of the user's critical experience.
 * Loading them at `afterInteractive` adds ~30-60ms of TBT for no UX win;
 * deferring to `requestIdleCallback` (with a 3s fallback) reclaims that
 * budget without losing any analytics fidelity — RUM still captures the
 * core web vitals after they're measured by the browser.
 */
export function VercelTelemetry() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as typeof window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const trigger = () => setReady(true);
    const idle =
      win.requestIdleCallback?.(trigger, { timeout: 3_000 }) ??
      window.setTimeout(trigger, 3_000);

    return () => {
      if (typeof idle === "number") {
        win.cancelIdleCallback?.(idle);
        window.clearTimeout(idle);
      }
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
