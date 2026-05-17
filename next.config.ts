import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
