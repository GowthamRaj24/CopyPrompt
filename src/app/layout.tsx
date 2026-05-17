import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AmbientOrbs } from "@/components/ambient/AmbientOrbs";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HiddenOnAuth } from "@/components/layout/HiddenOnAuth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { Toaster } from "@/components/ui/sonner";
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
    default: "CopyPrompt — The fastest way to find AI prompts",
    template: "%s · CopyPrompt",
  },
  description:
    "Search, copy and paste the best free prompts for ChatGPT, Claude, Midjourney, Flux, Gemini and every AI tool. No signup. No paywall.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  applicationName: "CopyPrompt",
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
  authors: [{ name: "CopyPrompt" }],
  creator: "CopyPrompt",
  publisher: "CopyPrompt",
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "CopyPrompt",
    title: "CopyPrompt — The fastest way to find AI prompts",
    description:
      "The fastest way to find, copy and paste prompts for every AI tool. Free forever.",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CopyPrompt — free AI prompts for every tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CopyPrompt — The fastest way to find AI prompts",
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
  verification: {
    google: "uGd1QDcGmlx3aDitoE46QL2v2ypQAWbW4ocI5Jz6gko"
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
      </body>
    </html>
  );
}
