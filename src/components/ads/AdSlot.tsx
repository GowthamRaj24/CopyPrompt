"use client";

import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";

type AdFormat = "auto" | "autorelaxed" | "rectangle" | "horizontal";
type AdFillStatus = "pending" | "filled" | "unfilled";

interface AdSlotProps {
  slot: string;
  format?: AdFormat;
  /** Maps to `data-full-width-responsive` on display units. */
  fullWidthResponsive?: boolean;
  className?: string;
  /** Called when AdSense reports fill / no-fill (used to collapse the ad strip). */
  onStatusChange?: (status: AdFillStatus) => void;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const FILL_CHECK_MS = 6_000;

function readAdStatus(el: HTMLElement): AdFillStatus {
  const raw = el.getAttribute("data-ad-status");
  if (raw === "filled") return "filled";
  if (raw === "unfilled") return "unfilled";
  return "pending";
}

/**
 * Renders a single AdSense `<ins>` unit and calls `.push({})` once
 * after mount. Unfilled slots stay collapsed so users never see empty
 * white boxes while the account is under review or inventory is low.
 */
export function AdSlot({
  slot,
  format = "auto",
  fullWidthResponsive = true,
  className,
  onStatusChange,
}: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [status, setStatus] = useState<AdFillStatus>("pending");

  const applyStatus = (next: AdFillStatus) => {
    setStatus(next);
    onStatusChange?.(next);
  };

  useEffect(() => {
    if (pushed.current || !ADSENSE_CLIENT) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      applyStatus("unfilled");
    }
  }, [slot]);

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    const sync = () => {
      const next = readAdStatus(el);
      if (next !== "pending") applyStatus(next);
    };

    sync();

    const observer = new MutationObserver(sync);
    observer.observe(el, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });

    const timeout = window.setTimeout(() => {
      const next = readAdStatus(el);
      if (next === "filled") {
        applyStatus("filled");
        return;
      }
      // Tall empty placeholder with no iframe → treat as unfilled.
      const hasIframe = el.querySelector("iframe") !== null;
      if (!hasIframe && el.offsetHeight > 120) {
        applyStatus("unfilled");
        return;
      }
      if (next === "unfilled") applyStatus("unfilled");
    }, FILL_CHECK_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [slot]);

  if (!ADSENSE_CLIENT) return null;

  // Pending: zero height so no white flash. Unfilled: remove from layout.
  if (status === "unfilled") return null;

  return (
    <div
      className={
        status === "pending"
          ? "h-0 min-h-0 overflow-hidden opacity-0"
          : "overflow-hidden rounded-lg"
      }
      aria-hidden={status === "pending"}
    >
      <ins
        ref={insRef}
        className={`adsbygoogle block ${className ?? ""}`}
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(fullWidthResponsive && format === "auto"
          ? { "data-full-width-responsive": "true" }
          : {})}
      />
    </div>
  );
}
