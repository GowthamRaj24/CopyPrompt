import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "What's new in mycopyprompt — every release, in plain English.",
  alternates: { canonical: "/changelog" },
};

interface Release {
  version: string;
  date: string;
  highlights: string[];
}

const RELEASES: Release[] = [
  {
    version: "1.0",
    date: "November 2026",
    highlights: [
      "Privacy policy expanded — data retention, COPPA, cookie enumeration, international transfers, GDPR basis",
      "Terms of service strengthened — liability, IP, DMCA, governing law, age requirements, dispute resolution",
      "ads.txt verified and cache headers configured for reliable AdSense detection",
      "JSON-LD logo reference fixed to match actual file",
      "Canonical URLs added to legal and informational pages",
    ],
  },
  {
    version: "0.9",
    date: "October 2026",
    highlights: [
      "Saved searches — save any search query + filters and receive a daily email digest of new matching prompts",
      "Contributor stats cron job — nightly refresh of leaderboard rankings",
      "Copy history pruning — automatic cleanup of copy records older than 30 days",
      "Performance indexes applied across prompts, collections, and favorites tables",
    ],
  },
  {
    version: "0.8",
    date: "September 2026",
    highlights: [
      "Collections — create private or public prompt boards, sharable at /c/<slug>",
      "Curated collections by the editorial team on the homepage and /collections",
      "Collection membership API — add/remove prompts from collections with one click",
      "Admin collection management dashboard",
    ],
  },
  {
    version: "0.7",
    date: "August 2026",
    highlights: [
      "Prompt remix — fork any public prompt with permanent attribution chain to the original author",
      "Remix chain visualization on prompt pages + dedicated /prompt/<slug>/remixes page",
      "Public creator profiles at /u/<handle> with bio, stats, and contributor badges",
      "Contributor leaderboard at /contributors ranked by total copies received",
    ],
  },
  {
    version: "0.6",
    date: "July 2026",
    highlights: [
      "AI prompt generator — describe your goal, Gemini 2.5 Flash writes a production-ready prompt",
      "Free daily generation quota per signed-in user with per-minute rate limits",
      "Generated prompts include title, recommended model, category, and usage tips",
      "Submit generated prompts directly to the public catalog with pre-filled fields",
    ],
  },
  {
    version: "0.5",
    date: "June 2026",
    highlights: [
      "6 original prompt engineering guides — ChatGPT, Claude, Midjourney, Flux, image vs text, platform tutorial",
      "Guide pages with structured Article JSON-LD and breadcrumbs",
      "llms.txt and llms-full.txt for AI engine ingestion",
      "Private prompt submissions with instant unlisted share URLs at /s/<token>",
      "Prompt visibility controls — promote private prompts to public",
    ],
  },
  {
    version: "0.4",
    date: "June 2026",
    highlights: [
      "Google AdSense integration with lazy loading and Auto ads",
      "AdSense meta tag + ads.txt + script tag triple verification",
      "Ad units hidden on auth routes — no ads on signin/signup/admin pages",
      "Lighthouse-friendly deferred loading — ads load after first interaction or 15s idle",
    ],
  },
  {
    version: "0.3",
    date: "May 11, 2026",
    highlights: [
      "Full design system overhaul — modern indigo palette, Geist typography",
      "Premium prompt cards with inline copy + save",
      "Favorites: saved across devices, synced via your account",
      "Better SEO: sitemap, robots, JSON-LD structured data",
    ],
  },
  {
    version: "0.2",
    date: "April 2026",
    highlights: [
      "Text-prompt support (ChatGPT, Claude, Gemini) alongside image prompts",
      "Sticky prompt detail page with two-column layout",
      "Category browsing with popular/latest sort",
    ],
  },
  {
    version: "0.1",
    date: "March 2026",
    highlights: [
      "Initial public release",
      "Image prompts (Flux, Midjourney, Stable Diffusion)",
      "Full-text search",
      "User accounts + submission flow",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2">Updates</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            Changelog
          </h1>
          <p className="mt-3 max-w-xl text-[14px] text-muted-foreground md:text-[15px]">
            What&apos;s new and what we&apos;re working on. Every release,
            documented in plain English.
          </p>
        </header>

        <ol className="space-y-10">
          {RELEASES.map((r, idx) => (
            <li
              key={r.version}
              className="reveal"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="mb-3 flex items-baseline gap-3">
                <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                  v{r.version}
                </span>
                <time className="text-[12px] text-muted-foreground">
                  {r.date}
                </time>
              </div>
              <ul className="ml-5 list-disc space-y-2 text-[14px] leading-[1.65] text-foreground/90">
                {r.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
