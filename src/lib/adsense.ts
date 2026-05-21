/** Google AdSense publisher client ID (ca-pub-…). */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/** Ad unit slot IDs from the AdSense dashboard. */
export const ADSENSE_SLOTS = {
  /** CopyPrompt Ads — responsive display unit. */
  display: "2458182531",
  /** Autorelaxed / in-feed multiplex unit. */
  multiplex: "7818320424",
} as const;
