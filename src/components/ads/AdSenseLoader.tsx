"use client";

import { useEffect, useState } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";

/**
 * Lazy AdSense loader.
 *
 * Loads `adsbygoogle.js` ONLY after one of:
 *   - first user scroll
 *   - first user interaction (mouse / touch / keyboard)
 *   - 5-second idle fallback (so Lighthouse / SEO crawls still see it)
 *
 * Why not `<Script strategy="afterInteractive">`?
 *   `afterInteractive` runs the script during the Lighthouse TBT window
 *   — the AdSense bundle is large enough (300-500ms parse on mid-range
 *   mobile) to single-handedly destroy the Performance score. Deferring
 *   it past first paint moves that cost outside the measurement window
 *   AND outside the user's perception of "page loaded".
 *
 * The actual ad units (`AdSlot` → `<ins>` + push) lazy-mount via
 * IntersectionObserver in `SiteAds`, so we never push to `adsbygoogle`
 * before the script has loaded.
 */
export function AdSenseLoader() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    if (shouldLoad) return;

    let cancelled = false;
    const trigger = () => {
      if (cancelled) return;
      cancelled = true;
      setShouldLoad(true);
    };

    const events: Array<keyof WindowEventMap> = [
      "scroll",
      "mousemove",
      "touchstart",
      "keydown",
      "pointerdown",
    ];
    for (const e of events) {
      window.addEventListener(e, trigger, {
        once: true,
        passive: true,
      } as AddEventListenerOptions);
    }

    // Idle fallback — load the script even if the user never interacts,
    // so crawlers + lighthouse + ad-fill detection still work.
    const idle =
      (
        window as typeof window & {
          requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        }
      ).requestIdleCallback?.(trigger, { timeout: 5_000 }) ??
      window.setTimeout(trigger, 5_000);

    return () => {
      cancelled = true;
      for (const e of events) {
        window.removeEventListener(e, trigger);
      }
      if (typeof idle === "number") window.clearTimeout(idle);
    };
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || !ADSENSE_CLIENT) return;
    if (document.querySelector("script[data-adsense-loader]")) return;

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.setAttribute("data-adsense-loader", "true");
    document.head.appendChild(script);
  }, [shouldLoad]);

  return null;
}
