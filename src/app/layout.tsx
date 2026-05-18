import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import { AmbientOrbs } from "@/components/ambient/AmbientOrbs";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HiddenOnAuth } from "@/components/layout/HiddenOnAuth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { Toaster } from "@/components/ui/sonner";
import { SITE_BRAND } from "@/lib/site-brand";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/jsonld";
import "./globals.css";

/* ─────────────────────────────────────────────────────────────
   Type system — modern, premium, neutral.

     Geist        body, headings, UI       (variable)
     Geist Mono   prompts, code, kbd       (variable)

   Two faces. Tight, confident, technical. The whole app reads
   like a Linear / Vercel / Raycast surface — minimal noise.
   ───────────────────────────────────────────────────────────── */

const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFB" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0F" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: SITE_BRAND.defaultTitle,
    template: SITE_BRAND.titleTemplate,
  },
  description: SITE_BRAND.description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  applicationName: SITE_BRAND.name,
  referrer: "origin-when-cross-origin",
  keywords: [
    "AI prompts",
    "ChatGPT prompts",
    "Claude prompts",
    "Midjourney prompts",
    "Flux prompts",
    "Gemini prompts",
    "DALL-E prompts",
    "Stable Diffusion prompts",
    "free AI prompts",
    "prompt library",
    "prompt engineering",
    "copy paste prompts",
    "AI prompt examples",
    "prompt templates",
  ],
  authors: [{ name: SITE_BRAND.name }],
  creator: SITE_BRAND.name,
  publisher: SITE_BRAND.name,
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: SITE_BRAND.name,
    title: SITE_BRAND.defaultTitle,
    description:
      "The fastest way to find, copy and paste prompts for every AI tool. Free forever.",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_BRAND.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_BRAND.defaultTitle,
    description:
      "Search, copy, paste. Prompts for every AI tool. Free forever.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  verification: {
    google: "jYpyNld4XqLrqhZxPKtFahW2RVQtP3xgtagyffNVkxw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Site-wide structured data: Organization + WebSite (with
            Sitelinks Search Box action). Both are emitted on every
            page so engines can build a coherent identity graph. */}
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Five colored orbs floating slowly behind every page —
            stays outside ThemeProvider so its CSS-only animations
            never re-mount on theme toggle. */}
        <AmbientOrbs />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FavoritesProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground focus:shadow-lg"
            >
              Skip to main content
            </a>
            <HiddenOnAuth>
              <Header />
            </HiddenOnAuth>
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <HiddenOnAuth>
              <Footer />
            </HiddenOnAuth>
            <Toaster
              richColors
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast: "border-border/40 bg-card/90 backdrop-blur-xl",
                },
              }}
            />
          </FavoritesProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
