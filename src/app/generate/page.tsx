import {
  CheckCircle2Icon,
  ImageIcon,
  MessageSquareIcon,
  SparklesIcon,
  WandIcon,
  ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { GeneratorCore } from "@/components/generate/GeneratorCore";
import { RATE_LIMITS } from "@/server/config/constants";
import { requireUser } from "@/server/lib/auth";
import { getRemainingQuotaToday } from "@/server/services/prompt-generator.service";

export const metadata: Metadata = {
  title: "Generate a prompt",
  description:
    "Describe what you want help with and we'll generate a production-ready AI prompt — ready to copy into ChatGPT, Claude, Gemini, Midjourney and more.",
  alternates: { canonical: "/generate" },
};

export const dynamic = "force-dynamic";

interface GeneratePageProps {
  searchParams: Promise<{ seed?: string }>;
}

export default async function GeneratePage({
  searchParams,
}: GeneratePageProps) {
  const user = await requireUser();
  const { seed } = await searchParams;

  const remaining = await getRemainingQuotaToday(user.id, user.plan);
  const dailyLimit =
    user.plan === "premium"
      ? RATE_LIMITS.GENERATE_PREMIUM_PER_DAY
      : RATE_LIMITS.GENERATE_FREE_PER_DAY;

  const isUnlimited = remaining === Number.POSITIVE_INFINITY;
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
          <div className="reveal mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[11.5px] font-semibold tracking-[-0.005em] text-primary backdrop-blur-md">
            <SparklesIcon className="size-3" strokeWidth={2.4} />
            Powered by Google Gemini 2.5 Flash
            <span className="ml-0.5 rounded-full bg-primary/25 px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wider">
              New
            </span>
          </div>
          <h1 className="reveal delay-2 mt-5 text-balance text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.045em]">
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

        {/* ── Generator surface ────────────────────────── */}
        <div className="mx-auto max-w-3xl">
          <GeneratorCore
            initialQuotaRemaining={isUnlimited ? -1 : remaining}
            initialDescription={seedText}
            variant="hero"
          />
        </div>

        {/* ── How it works (footer) ────────────────────── */}
        <div className="mx-auto mt-16 max-w-3xl border-t border-border/40 pt-8">
          <h2 className="mb-5 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <WandIcon className="size-3" strokeWidth={2.4} />
            How it works
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
