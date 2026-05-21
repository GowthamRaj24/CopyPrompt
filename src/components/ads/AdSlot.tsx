"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";

type AdFormat = "auto" | "autorelaxed" | "rectangle" | "horizontal";

interface AdSlotProps {
  slot: string;
  format?: AdFormat;
  /** Maps to `data-full-width-responsive` on display units. */
  fullWidthResponsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/**
 * Renders a single AdSense `<ins>` unit and calls `.push({})` once
 * after mount. The global loader lives in `layout.tsx`; this component
 * only handles per-unit initialization.
 */
export function AdSlot({
  slot,
  format = "auto",
  fullWidthResponsive = true,
  className,
}: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !ADSENSE_CLIENT) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers, SSR, or script not ready — fail silently.
    }
  }, [slot]);

  if (!ADSENSE_CLIENT) return null;

  return (
    <ins
      className={`adsbygoogle block overflow-hidden rounded-lg ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      {...(fullWidthResponsive && format === "auto"
        ? { "data-full-width-responsive": "true" }
        : {})}
    />
  );
}
