"use client";

import { useEffect } from "react";

/**
 * Records one view per prompt per browser session.
 * Uses `sendBeacon` so it never delays navigation or rendering.
 */
export function ViewBeacon({ promptId }: { promptId: string }) {
  useEffect(() => {
    const key = `mcp:viewed:${promptId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode) — still count the view.
    }
    const url = `/api/prompts/${promptId}/view`;
    if (!navigator.sendBeacon?.(url)) {
      void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
    }
  }, [promptId]);

  return null;
}
