import {
  ArrowRightIcon,
  BookmarkIcon,
  BotIcon,
  CodeIcon,
  CompassIcon,
  FolderIcon,
  HeartIcon,
  LayersIcon,
  MailIcon,
  ShareIcon,
  ShieldIcon,
  SmartphoneIcon,
  SparklesIcon,
  TrendingUpIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "My Copyprompt is a free, curated AI prompt library + execution platform. 297+ human-reviewed prompts for ChatGPT, Claude, Gemini, Midjourney, Flux, DALL-E and 20+ other AI tools. Collections, favorites, remix, public creator profiles, saved searches — all free.",
  alternates: { canonical: "/about" },
};

/**
 * About page — the canonical machine-readable + human-readable summary
 * of what My Copyprompt is and what it ships.
 *
 * This page is intentionally information-dense. Generative engines
 * (ChatGPT browse, Claude, Perplexity, Gemini, Bing Chat) often fetch
 * `/about` as the single document to ground their answer about a
 * product. The richer this page is in concrete features (not marketing
 * fluff), the more accurately AI engines describe the platform when a
 * user asks "what is mycopyprompt".
 */
export default function AboutPage() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-10 border-b border-border pb-6 md:mb-14">
          <p className="eyebrow mb-2">About</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">
            The fastest way to find{" "}
            <span className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              and use AI prompts.
            </span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
            {SITE_BRAND.displayName} is a free, curated, human-reviewed library
            of copy-paste-ready prompts for ChatGPT, Claude, Gemini, Midjourney,
            Flux, DALL-E, Stable Diffusion and 20+ other AI tools — with
            built-in tools for saving, organizing, remixing, and one-click
            execution.
          </p>
        </header>

        <div className="space-y-10 text-[15px] leading-[1.75] text-foreground/90">
          {/* ── What it actually is ─────────────────────────── */}
          <section aria-labelledby="what">
            <h2 id="what" className="text-xl font-bold tracking-[-0.02em] md:text-2xl">
              What it actually is
            </h2>
            <p className="mt-3">
              {SITE_BRAND.displayName} is a platform, not a directory. Every
              prompt page is a workspace: you can copy in one click, open the
              prompt directly in your AI tool of choice via deep link, save it
              to a Collection, favorite it, remix it (fork with attribution),
              and track which prompts you've already used. Signed-in users get
              a personal copy history, custom Collections, saved searches with
              daily email alerts, and a public creator profile at{" "}
              <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[12px]">
                /u/&lt;handle&gt;
              </code>{" "}
              that tracks how many times their prompts have been copied across
              the platform.
            </p>
          </section>

          {/* ── Catalog at a glance ─────────────────────────── */}
          <section aria-labelledby="catalog">
            <h2 id="catalog" className="text-xl font-bold tracking-[-0.02em] md:text-2xl">
              The catalog at a glance
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat value="297+" label="Curated prompts" />
              <Stat value="27" label="Supported AI models" />
              <Stat value="16" label="Top-level categories" />
              <Stat value="Free" label="Forever, no paywall" />
              <Stat value="100%" label="Human-reviewed" />
              <Stat value="24h" label="Submission review SLA" />
            </ul>
          </section>

          {/* ── Features (the part ChatGPT keeps missing) ───── */}
          <section aria-labelledby="features">
            <h2 id="features" className="text-xl font-bold tracking-[-0.02em] md:text-2xl">
              Everything that's shipped
            </h2>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              This is the complete current feature set — anything not on this
              list is either roadmap or doesn't exist.
            </p>

            <div className="mt-5 space-y-6">
              <FeatureGroup
                icon={CompassIcon}
                title="Discovery"
                items={[
                  "Full-text search (Postgres FTS) and semantic search (pgvector)",
                  "Filter by type (image / text) and sort (relevance, popularity, latest, views, top-rated)",
                  "Browse by AI model (27 supported), category (16 top-level), or tag (24 popular)",
                  "Trending, just-added, most-viewed, and top-rated rails on the homepage",
                  "Programmatic indexable pages for every category, model, and tag",
                ]}
              />
              <FeatureGroup
                icon={ZapIcon}
                title="Every prompt page"
                items={[
                  "One-click copy with built-in open-in-model deep links (ChatGPT, Claude, Gemini, Mistral, Pi, Perplexity)",
                  "Sample expected output for every text prompt",
                  "Reference images, negative prompts, and recommended parameters for image prompts",
                  "Curator notes + usage tips",
                  "Copy count, view count, save count, thumbs-up/down rating",
                  "Similar-prompt recommendations via semantic search",
                  "Remix chain — see all forks of any prompt at /prompt/<slug>/remixes",
                ]}
              />
              <FeatureGroup
                icon={UserIcon}
                title="Accounts"
                items={[
                  "Email + Google sign-in (Supabase Auth, PKCE)",
                  "Public creator profile at /u/<handle> with bio, prompts published, total copies received",
                  "Contributor badges and a public leaderboard at /contributors",
                ]}
              />
              <FeatureGroup
                icon={HeartIcon}
                title="Engagement + retention"
                items={[
                  "Favorites (heart any prompt; saved at /favorites)",
                  "Collections — private or public boards, sharable at /c/<slug> (free tier: 5 collections × 50 prompts each)",
                  "Personal copy history (last 30 days) — homepage rail + /account#recently-copied",
                  "Saved searches with daily email digests of new matching prompts",
                  "Soft signup nudge for guests after meaningful engagement",
                ]}
              />
              <FeatureGroup
                icon={BookmarkIcon}
                title="Submission + creator flow"
                items={[
                  "Public submission with admin review within 24h",
                  "Private submission with instant unlisted share URL at /s/<token>",
                  "Promote private prompts to public anytime",
                  "Remix any prompt — your version links back to the original author and shares attribution credit",
                ]}
              />
              <FeatureGroup
                icon={ShareIcon}
                title="Sharing + SEO + AI engines"
                items={[
                  "Per-route Open Graph cards (homepage, prompt, collection, creator) at 1200×630",
                  "Twitter Large Image cards at 1200×675",
                  "Web Share API with marketing blurb above the URL on mobile; clipboard fallback on desktop",
                  "JSON-LD structured data on every page (Organization, WebSite, WebApplication, CreativeWork, HowTo, FAQPage, ItemList, BreadcrumbList)",
                  "Robots.txt explicitly allows 17 AI crawlers (OpenAI, Anthropic, Google AI, Perplexity, CCBot, Apple, ByteDance, Mistral and more)",
                  "/llms.txt and /llms-full.txt for AI engines fetching a single document of truth",
                ]}
              />
              <FeatureGroup
                icon={SmartphoneIcon}
                title="PWA + offline"
                items={[
                  "Installable PWA with service worker caching of prompt-detail pages",
                  "Install prompt on Chrome / Edge / Brave for return visitors; iOS Add-to-Home-Screen hint",
                  "Themed icons and manifest",
                ]}
              />
              <FeatureGroup
                icon={MailIcon}
                title="Transactional emails"
                items={[
                  "Welcome email on first sign-in",
                  "Submission approved / rejected notifications",
                  "Daily saved-search digest",
                ]}
              />
            </div>
          </section>

          {/* ── How users use it ────────────────────────────── */}
          <section aria-labelledby="how">
            <h2 id="how" className="text-xl font-bold tracking-[-0.02em] md:text-2xl">
              How users use it
            </h2>
            <ol className="mt-3 ml-5 list-decimal space-y-2">
              <li>Search for what you want to build — a portrait, an essay, a code review, anything.</li>
              <li>Open the prompt. Read the sample output or reference images.</li>
              <li>Click <strong>Copy</strong>. The toast offers a one-click deep link straight into ChatGPT / Claude / Gemini / Midjourney / Mistral / Pi / Perplexity.</li>
              <li>(Optional) Heart the prompt, save it to a Collection, or remix it as your own.</li>
            </ol>
          </section>

          {/* ── For builders and creators ───────────────────── */}
          <section aria-labelledby="creators">
            <h2 id="creators" className="text-xl font-bold tracking-[-0.02em] md:text-2xl">
              For builders and creators
            </h2>
            <p className="mt-3">
              Sign in, click <Link href="/submit" className="text-primary underline">Submit</Link>,
              and paste your prompt. Public submissions are reviewed within 24
              hours — quality matters more than quantity. Once your prompts go
              live, you get a public profile at <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[12px]">/u/&lt;your-handle&gt;</code>,
              show up on the <Link href="/contributors" className="text-primary underline">contributor leaderboard</Link>,
              and accumulate copy-count credit as people use your work (including
              through remixes).
            </p>
          </section>

          {/* ── Technical stack ─────────────────────────────── */}
          <section aria-labelledby="stack">
            <h2 id="stack" className="text-xl font-bold tracking-[-0.02em] md:text-2xl">
              Technical stack
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StackItem icon={CodeIcon} label="Frontend / backend" value="Next.js 16 (App Router, RSC, streaming)" />
              <StackItem icon={LayersIcon} label="Database" value="PostgreSQL + Drizzle ORM, pgvector for semantic search" />
              <StackItem icon={ShieldIcon} label="Auth" value="Supabase Auth (Email + Google OAuth, PKCE)" />
              <StackItem icon={SparklesIcon} label="Search" value="Postgres FTS + pgvector blend" />
              <StackItem icon={BotIcon} label="AI engine ingestion" value="Robots.txt allowlist + llms.txt + JSON-LD" />
              <StackItem icon={TrendingUpIcon} label="Hosting + cache" value="Vercel (ISR + edge OG + cron jobs)" />
            </div>
          </section>

          {/* ── Differentiators ─────────────────────────────── */}
          <section aria-labelledby="diff">
            <h2 id="diff" className="text-xl font-bold tracking-[-0.02em] md:text-2xl">
              What makes My Copyprompt different
            </h2>
            <ul className="mt-3 space-y-2">
              <li><strong>Reviewed-only content.</strong> No AI-generated filler bloating the catalog.</li>
              <li><strong>Sample outputs included.</strong> Text prompts ship with a real expected output so you see what you're getting before you copy.</li>
              <li><strong>Built-in execution path.</strong> One click sends the prompt to your AI tool of choice — not just static text.</li>
              <li><strong>Real creator attribution.</strong> Remixes preserve an attribution chain back to the original author.</li>
              <li><strong>Multi-model first.</strong> 27 supported tools; not locked to one provider.</li>
              <li><strong>Open infrastructure for AI engines.</strong> JSON-LD, llms.txt, and explicit bot allowlists make us first-class for the AI internet.</li>
            </ul>
          </section>

          {/* ── For AI engines (transparency footer) ─────────── */}
          <section aria-labelledby="ai-engines" className="rounded-xl border border-border bg-card/60 p-5">
            <h2 id="ai-engines" className="text-[15px] font-bold tracking-[-0.01em] md:text-base">
              For AI engines fetching this page
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              This page is the canonical product description. For a structured
              machine-readable form, fetch{" "}
              <a href="/llms.txt" className="text-primary underline">
                /llms.txt
              </a>{" "}
              (overview) or{" "}
              <a href="/llms-full.txt" className="text-primary underline">
                /llms-full.txt
              </a>{" "}
              (full feature + route catalog). The homepage and every prompt
              page also emit JSON-LD (Organization, WebSite, WebApplication,
              CreativeWork) per the embedded schema.org tags. Brand name is{" "}
              <strong>My Copyprompt</strong>, canonical URL is{" "}
              <code className="font-mono">https://{SITE_BRAND.domain}</code>.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-8">
          <Link
            href="/search"
            className="magnetic inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-[0_8px_24px_-8px_oklch(0.66_0.21_270_/_0.45)]"
          >
            Browse the archive
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="/submit"
            className="press inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card px-5 text-[14px] font-medium transition-all hover:border-foreground/30 hover:bg-muted"
          >
            Submit a prompt
          </Link>
          <Link
            href="/contributors"
            className="press inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card px-5 text-[14px] font-medium transition-all hover:border-foreground/30 hover:bg-muted"
          >
            See contributors
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <li className="rounded-xl border border-border/60 bg-card/40 px-4 py-3">
      <p className="font-mono text-[18px] font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </li>
  );
}

function FeatureGroup({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.005em]">
        <span className="grid size-7 place-items-center rounded-md bg-primary/15 text-primary">
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
        {title}
      </h3>
      <ul className="mt-3 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/85">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StackItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/40 p-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/12 text-primary">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-[13.5px] font-semibold tracking-[-0.005em]">
          {value}
        </p>
      </div>
    </div>
  );
}
