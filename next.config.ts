import type { NextConfig } from "next";

const PRODUCTION_HOST = "mycopyprompt.in";

const nextConfig: NextConfig = {
  // Strip console.* calls (except errors / warnings) from production
  // bundles — saves a few KB and removes the parser cost of every
  // console statement, helping TBT on lower-end devices.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    // Tree-shake imports from these packages so we only ship the
    // icons / utilities we actually use, not the whole barrel file.
    optimizePackageImports: ["lucide-react", "sonner"],
  },
  async redirects() {
    // Only redirect the old Vercel hostname. Do NOT redirect www here —
    // Vercel → Domains should handle www ↔ apex in one place, or you get
    // ERR_TOO_MANY_REDIRECTS when both layers fight each other.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "copy-prompt.vercel.app" }],
        destination: `https://${PRODUCTION_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    // Static, content-addressable / rarely-changing assets ship with a
    // 1-year `immutable` cache so repeat visits skip the network entirely.
    // Lighthouse's "Use efficient cache lifetimes" audit flagged 17 KiB
    // of savings before this — almost all of it from the icons, favicon,
    // and PWA manifest assets falling into the default short cache.
    const ONE_YEAR = "public, max-age=31536000, immutable";
    return [
      {
        // Hashed app icons + apple-touch icon — content rarely changes,
        // and when it does we ship a new filename. Safe to cache forever.
        source: "/:file(favicon\\.ico|apple-icon\\.png|icon-32\\.png|icon-192\\.png|icon-512\\.png|logo\\.png)",
        headers: [{ key: "Cache-Control", value: ONE_YEAR }],
      },
      {
        // PWA manifest icons + brand assets in /icons/
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: ONE_YEAR }],
      },
      {
        // Fonts in /public — Geist is also served from /_next/static
        // (Next handles those automatically) but any sideload here gets
        // the same treatment.
        source: "/:path*.(woff2|woff|ttf|otf)",
        headers: [{ key: "Cache-Control", value: ONE_YEAR }],
      },
      {
        // LLM index files change occasionally but reads from AI engines
        // are infrequent — daily cache + a week of stale-while-revalidate
        // keeps the CDN hot without making updates wait.
        source: "/llms:variant(|-full).txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      // Picsum placeholders for seed prompts
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Supabase Storage — primary image host (free tier, CDN-backed).
      // Pattern matches any Supabase project (`<ref>.supabase.co`).
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      // Cloudflare R2 buckets (optional, if you migrate later)
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Cloudflare Images variants (optional)
      { protocol: "https", hostname: "imagedelivery.net" },
    ],
  },
};

export default nextConfig;
