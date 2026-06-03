import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ImageIcon,
  MessageSquareIcon,
  WandIcon,
  ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GeneratorCore } from "@/components/generate/GeneratorCore";
import { SITE_BRAND } from "@/lib/site-brand";
import { RATE_LIMITS } from "@/server/config/constants";
import { getCurrentUser } from "@/server/lib/auth";
import { getRemainingQuotaToday } from "@/server/services/prompt-generator.service";

export const metadata: Metadata = {
  title: "AI Prompt Generator — write prompts with Gemini for ChatGPT, Claude, Midjourney and more",
  description:
    "Describe what you want help with and our AI prompt generator (powered by Google Gemini 2.5 Flash) writes a production-ready prompt — role + rules + placeholders + sample format — ready to copy into ChatGPT, Claude, Gemini, Midjourney, Flux, DALL-E, Stable Diffusion or any other AI tool. Free, fast, no signup to preview.",
  keywords: [
    "AI prompt generator",
    "free prompt generator",
    "ChatGPT prompt generator",
    "Claude prompt generator",
    "Midjourney prompt generator",
    "Gemini prompt writer",
    "prompt engineering tool",
  ],
  alternates: { canonical: "/generate" },
  openGraph: {
    title: "AI Prompt Generator — write prompts with Gemini",
    description:
      "Tell us what you want; Gemini writes a production-ready prompt. Copy into ChatGPT, Claude, Midjourney and more. Free.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

interface GeneratePageProps {
  searchParams: Promise<{ seed?: string }>;
}

export default async function GeneratePage({
  searchParams,
}: GeneratePageProps) {
  // `getCurrentUser()` instead of `requireUser()` — the page itself is
  // public so crawlers + signed-out visitors get the full marketing
  // explainer (good for SEO + conversion). Only the actual /api/generate
  // endpoint enforces auth.
  const [user, { seed }] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  // Per-user quota only needed when signed in.
  let remaining = 0;
  let isUnlimited = false;
  if (user) {
    const raw = await getRemainingQuotaToday(user.id, user.plan);
    if (raw === Number.POSITIVE_INFINITY) {
      isUnlimited = true;
    } else {
      remaining = raw;
    }
  }
  const dailyLimit =
    user?.plan === "premium"
      ? RATE_LIMITS.GENERATE_PREMIUM_PER_DAY
      : RATE_LIMITS.GENERATE_FREE_PER_DAY;

  const seedText = typeof seed === "string" ? seed.slice(0, 2_000) : "";

  return (
    <section className="relative isolate">
      {/* ── Hero atmosphere ─────────────────────────────── */}
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[500px]"
      />
      <div
        aria-hidden
        className="bg-hero pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.66_0.21_270_/_0.22),transparent_70%)]"
      />

      <div className="container relative mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        {/* ── Hero ─────────────────────────────────────── */}
        <header className="hero-enter mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <h1 className="reveal delay-2 text-balance text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.045em]">
            Describe what you need.
            <br />
            We&apos;ll write{" "}
            <span className="bg-gradient-to-br from-[#A78BFA] via-[#6366F1] to-[#3B82F6] bg-clip-text text-transparent">
              a perfect prompt.
            </span>
          </h1>
          <p className="reveal delay-3 mt-4 text-balance text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
            Production-ready, model-specific, with sample structure and placeholders.
            Copy straight into ChatGPT, Claude, Gemini, Midjourney, Flux and more.
          </p>

          {/* Feature pills */}
          <ul className="reveal delay-4 mt-7 flex flex-wrap items-center justify-center gap-1.5">
            <FeaturePill
              icon={<ZapIcon className="size-3" strokeWidth={2.4} />}
              label="Generates in ~2 seconds"
            />
            <FeaturePill
              icon={<CheckCircle2Icon className="size-3" strokeWidth={2.4} />}
              label="Model-tagged + categorized"
            />
            <FeaturePill
              icon={<MessageSquareIcon className="size-3" strokeWidth={2.4} />}
              label="Text"
            />
            <FeaturePill
              icon={<ImageIcon className="size-3" strokeWidth={2.4} />}
              label="Image"
            />
          </ul>

          {/* Quota badge */}
          <div className="reveal delay-4 mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11.5px] backdrop-blur-md">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
              Today
            </span>
            <span className="font-mono text-[12px] font-bold tabular-nums">
              {isUnlimited ? "∞" : `${remaining} / ${dailyLimit}`}
            </span>
            <span className="text-muted-foreground/80">
              {isUnlimited
                ? "Admin tier"
                : remaining > 0
                  ? "Generations left"
                  : "Resets in 24h"}
            </span>
          </div>
        </header>

        {/* ── Generator surface (signed-in) OR sign-in CTA (guests) ── */}
        <div className="mx-auto max-w-3xl">
          {user ? (
            <GeneratorCore
              initialQuotaRemaining={isUnlimited ? -1 : remaining}
              initialDescription={seedText}
              variant="hero"
            />
          ) : (
            <SignInToGenerateCta seedText={seedText} />
          )}
        </div>

        {/* ── SEO content: long-form explainer paragraphs ──
            This block is the meat of the page for crawlers + AI engines.
            Adds ~600 words of indexable prose explaining what the tool
            does, who it's for, and how it works. Renders for everyone. */}
        <article
          className="mx-auto mt-20 max-w-3xl border-t border-border/40 pt-10"
          aria-labelledby="generator-explainer-heading"
        >
          <h2
            id="generator-explainer-heading"
            className="text-2xl font-bold tracking-[-0.02em] md:text-3xl"
          >
            How the {SITE_BRAND.displayName} AI Prompt Generator works
          </h2>

          <p className="mt-5 text-[14.5px] leading-[1.7] text-foreground/85">
            Prompt engineering is the most under-taught skill in AI today. The
            same model can produce a brilliant answer or a useless one based
            entirely on how you ask. Our prompt generator does the asking for
            you. Describe your task in plain English — &ldquo;help me write a
            cold outbound email to a SaaS founder,&rdquo; or &ldquo;a
            Midjourney prompt for a moody cyberpunk detective at dusk&rdquo; —
            and Google&apos;s Gemini 2.5 Flash composes a complete
            production-grade prompt: role and objective, specific rules,
            placeholders you can fill in, output format, and one common
            failure-mode warning.
          </p>

          <p className="mt-4 text-[14.5px] leading-[1.7] text-foreground/85">
            Every generated prompt is tagged with the recommended AI model
            (ChatGPT, ChatGPT 5, Claude Sonnet, Claude Opus, Gemini, Grok,
            DeepSeek, Llama, Mistral, Perplexity, Copilot, Pi, Midjourney,
            Flux, Stable Diffusion XL, Stable Diffusion 3, DALL-E 3, Ideogram,
            Leonardo AI, Adobe Firefly, Imagen, or Recraft) and a category so
            you know exactly where to use it. Click <strong>Copy</strong> to
            send the prompt to your clipboard, click{" "}
            <strong>Open in ChatGPT</strong> (or any of our 6 deep-link
            targets) to open the AI with your prompt pre-filled, or submit it
            to our public catalog for the community to use.
          </p>

          <h3 className="mt-10 text-xl font-bold tracking-[-0.015em] md:text-2xl">
            Who this is for
          </h3>
          <p className="mt-3 text-[14.5px] leading-[1.7] text-foreground/85">
            Marketers writing email campaigns, founders preparing investor
            updates, engineers wanting code-review prompts, students drafting
            essays and study plans, designers exploring image-generation
            styles, recruiters writing job descriptions, and anyone who has
            tried ChatGPT and thought &ldquo;there has to be a better way to
            ask this.&rdquo; The generator is fast (~2 seconds), free up to
            30 prompts per day, and requires no upfront knowledge of prompt
            engineering theory.
          </p>

          <h3 className="mt-10 text-xl font-bold tracking-[-0.015em] md:text-2xl">
            What makes a great AI prompt?
          </h3>
          <p className="mt-3 text-[14.5px] leading-[1.7] text-foreground/85">
            Every prompt our generator writes follows the same proven structure
            used by the best published prompt libraries. It opens with a clear
            role and objective (&ldquo;You are X. Your job is Y.&rdquo;),
            specifies what placeholders the user must fill in, lists four to
            seven specific rules (do this, don&apos;t do that), defines the
            output format the user wants back, and ends with a single warning
            about the most common failure mode for that task. This structure
            is what separates a prompt that consistently produces useful
            results from one that you have to retry six times to get what you
            meant.
          </p>

          <h3 className="mt-10 text-xl font-bold tracking-[-0.015em] md:text-2xl">
            Frequently asked questions
          </h3>

          <div className="mt-5 space-y-5">
            <Faq question="Is the AI prompt generator free?">
              Yes. Every signed-in user gets 30 generations per day on the
              free tier — more than enough for most users. Generations are
              processed via Google Gemini&apos;s free tier under the hood, so
              there&apos;s no paywall. Browsing the existing catalog of 297+
              prompts is free without an account.
            </Faq>
            <Faq question="Which AI model does the generator use?">
              We use Google Gemini 2.5 Flash because it is fast, accurate, and
              free to use through Google AI Studio at our current scale. The
              generator&apos;s system instructions are tuned by hand to produce
              prompts that match how the best prompt engineers write them, not
              what Gemini would output by default.
            </Faq>
            <Faq question="Will the prompts work in ChatGPT and Claude too?">
              Yes — the generated prompts are model-agnostic by design. The
              generator picks the most appropriate model slug as a suggestion,
              but every text prompt is portable to ChatGPT, Claude, Gemini,
              Perplexity, or any other LLM. For image prompts (Midjourney,
              Flux, DALL-E, Stable Diffusion) the syntax also transfers
              cleanly across models.
            </Faq>
            <Faq question="Can I submit my generated prompt to the public catalog?">
              Yes. After generating, click <em>Submit to catalog</em> and the
              fields are pre-filled. Add a sample output (for text prompts) or
              an example image URL (for image prompts) and submit for review.
              We review submissions within 24 hours, and approved prompts go
              live with full attribution to you on your public profile.
            </Faq>
            <Faq question="What about privacy?">
              Your generated prompts are stored in your account history for 30
              days. Your IP is salted and hashed (we never store the raw
              address). We don&apos;t share your descriptions with anyone,
              including Google beyond the API call needed to generate. You can
              delete your account and all data at any time from{" "}
              <Link
                href="/account/danger-zone"
                className="text-primary underline"
              >
                Account → Privacy &amp; data
              </Link>
              .
            </Faq>
          </div>
        </article>

        {/* ── How it works strip ────────────────────────── */}
        <div className="mx-auto mt-16 max-w-3xl border-t border-border/40 pt-8">
          <h2 className="mb-5 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <WandIcon className="size-3" strokeWidth={2.4} />
            How it works in 3 steps
          </h2>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HowStep
              n={1}
              title="Describe"
              text="Tell us your goal in plain English — what you're making and who it's for."
            />
            <HowStep
              n={2}
              title="Generate"
              text="Gemini composes a role-and-rules prompt tailored to the right AI model."
            />
            <HowStep
              n={3}
              title="Copy or open"
              text="Click copy, open the prompt in your AI of choice, or submit it to the catalog."
            />
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function SignInToGenerateCta({ seedText }: { seedText: string }) {
  const next = seedText
    ? `/generate?seed=${encodeURIComponent(seedText)}`
    : "/generate";
  return (
    <div className="reveal relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.10] via-card/60 to-card/40 p-6 backdrop-blur-md sm:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
          <WandIcon className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] md:text-[17px]">
            Sign in to generate your first prompt
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Free account · 30 generations per day · Email or Google sign-in ·
            Your prompts stay in your history for 30 days.
          </p>
        </div>
        <Button asChild size="default" className="shrink-0 gap-1.5">
          <Link href={`/signin?next=${encodeURIComponent(next)}`}>
            Sign in to generate
            <ArrowRightIcon className="size-3.5" strokeWidth={2.4} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Faq({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[15px] font-semibold tracking-[-0.01em]">
        {question}
      </h4>
      <p className="mt-2 text-[14px] leading-[1.7] text-foreground/80">
        {children}
      </p>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function FeaturePill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
      <span className="text-primary/80">{icon}</span>
      {label}
    </li>
  );
}

function HowStep({
  n,
  title,
  text,
}: {
  n: number;
  title: string;
  text: string;
}) {
  return (
    <li className="rounded-xl border border-border/50 bg-card/40 p-4">
      <span className="inline-flex size-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10 font-mono text-[11px] font-bold text-primary">
        {n}
      </span>
      <p className="mt-2.5 text-[13px] font-semibold tracking-[-0.005em]">
        {title}
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        {text}
      </p>
    </li>
  );
}
