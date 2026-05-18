import type { NextConfig } from "next";

const PRODUCTION_HOST = "mycopyprompt.in";

const nextConfig: NextConfig = {
  experimental: {
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
