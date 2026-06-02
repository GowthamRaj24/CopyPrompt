"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { ADSENSE_CLIENT, ADSENSE_SLOTS } from "@/lib/adsense";

const HIDE_PREFIXES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/admin",
];

type SlotKey = "display" | "multiplex";
type SlotStatus = "pending" | "filled" | "unfilled";

/**
 * Site-wide ad placements. Slots always mount (off-screen while pending)
 * so we can detect fill status. The strip only becomes visible when at
 * least one unit is filled — no empty white boxes above the footer.
 */
export function SiteAds() {
  const pathname = usePathname();
  const [statuses, setStatuses] = useState<Record<SlotKey, SlotStatus>>({
    display: "pending",
    multiplex: "pending",
  });

  const onStatusChange = useCallback((key: SlotKey, status: SlotStatus) => {
    setStatuses((prev) =>
      prev[key] === status ? prev : { ...prev, [key]: status },
    );
  }, []);

  const { anyFilled, allUnfilled } = useMemo(() => {
    const values = Object.values(statuses);
    return {
      anyFilled: values.some((s) => s === "filled"),
      allUnfilled: values.every((s) => s === "unfilled"),
    };
  }, [statuses]);

  if (!ADSENSE_CLIENT) return null;
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (allUnfilled) return null;

  /*
   * IMPORTANT: We cannot collapse the container to `sr-only` (width: 1px)
   * while waiting for fill status. AdSense reads the slot's available
   * width on push and rejects with `No slot size for availableWidth=1`
   * when the container is sr-only. Instead we keep the strip at full
   * container width and only hide the visual chrome (padding, border,
   * "Sponsored" label) until at least one slot reports filled.
   */
  return (
    <aside
      aria-label="Advertisement"
      className={
        anyFilled
          ? "site-ads cv-below-fold border-t border-border/30 bg-card/10"
          : "site-ads-pending overflow-hidden"
      }
      style={anyFilled ? undefined : { contentVisibility: "auto" }}
    >
      <div
        className={
          anyFilled
            ? "container mx-auto space-y-6 px-4 py-8 sm:px-6 md:py-10"
            : "container mx-auto px-4 sm:px-6"
        }
      >
        <div className="mx-auto w-full max-w-3xl">
          {anyFilled && (
            <p className="mb-2 text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
              Sponsored
            </p>
          )}
          <AdSlot
            slot={ADSENSE_SLOTS.display}
            format="auto"
            fullWidthResponsive
            onStatusChange={(s) => onStatusChange("display", s)}
          />
        </div>
        <div className="mx-auto w-full max-w-4xl">
          <AdSlot
            slot={ADSENSE_SLOTS.multiplex}
            format="autorelaxed"
            onStatusChange={(s) => onStatusChange("multiplex", s)}
          />
        </div>
      </div>
    </aside>
  );
}
