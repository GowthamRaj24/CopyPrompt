"use client";

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

/**
 * Site-wide ad placements — both AdSense units on every public page.
 * Hidden on auth and admin routes so sign-in and moderation stay clean.
 */
export function SiteAds() {
  const pathname = usePathname();

  if (!ADSENSE_CLIENT) return null;
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <aside
      aria-label="Advertisement"
      className="cv-below-fold border-t border-border/30 bg-card/10"
    >
      <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <AdSlot
            slot={ADSENSE_SLOTS.display}
            format="auto"
            fullWidthResponsive
          />
        </div>
        <div className="mx-auto w-full max-w-4xl">
          <AdSlot slot={ADSENSE_SLOTS.multiplex} format="autorelaxed" />
        </div>
      </div>
    </aside>
  );
}
