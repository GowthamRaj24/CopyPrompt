import type { MetadataRoute } from "next";
import { SITE_BRAND } from "@/lib/site-brand";

/**
 * Web app manifest.
 *
 * Why: a manifest signals to engines and browsers that this is a polished,
 * "installable" web app. Google uses some of its fields (name, description,
 * theme_color) as fallbacks when other metadata is missing, and the
 * lighthouse PWA audit becomes a free SEO signal.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_BRAND.defaultTitle,
    short_name: SITE_BRAND.name,
    description:
      "Search, copy, paste. Free curated prompts for ChatGPT, Claude, Midjourney, Flux, Gemini and every AI tool.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAFAFB",
    theme_color: "#FAFAFB",
    orientation: "portrait",
    categories: ["productivity", "education", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      // Add real PNG icons here when available, e.g.:
      // { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      // { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
