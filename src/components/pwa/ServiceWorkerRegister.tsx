"use client";

import { useEffect } from "react";

/**
 * Registers `/sw.js` once the page has finished loading.
 *
 *   - Skip in development (Next dev server's HMR + sw don't mix).
 *   - Skip when the browser has no Service Worker API (older Safari etc.).
 *   - Defers registration until the `load` event so service worker
 *     install never competes with first-paint resources.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("[sw] registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
