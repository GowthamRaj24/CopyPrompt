import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new in mycopyprompt — every release, in plain English.",
};

interface Release {
  version: string;
  date: string;
  highlights: string[];
}

const RELEASES: Release[] = [
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
            What&apos;s new and what we&apos;re working on.
          </p>
        </header>

        <ol className="space-y-10">
          {RELEASES.map((r, idx) => (
            <li key={r.version} className="reveal" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                  v{r.version}
                </span>
                <time className="text-[12px] text-muted-foreground">{r.date}</time>
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
