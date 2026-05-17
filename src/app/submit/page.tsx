import {
  CheckCircle2Icon,
  ClockIcon,
  PencilIcon,
  SparklesIcon,
  TargetIcon,
  WandSparklesIcon,
  ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { requireUser } from "@/server/lib/auth";
import {
  getCategoriesForSelect,
  getModelsForSelect,
  getPopularTags,
} from "@/server/services/submission.service";
import { SubmitForm } from "./components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit a prompt",
  description:
    "Share your favorite AI prompts with the community. Four fields, two minutes, no signup wall.",
};

/**
 * Curated starter tags merged with DB tags so suggestions are useful
 * even when the archive is small.
 */
const STARTER_TAGS = [
  "cinematic",
  "portrait",
  "cyberpunk",
  "neon",
  "fantasy",
  "anime",
  "photorealistic",
  "minimalist",
  "advisor",
  "validation",
  "code-review",
  "email",
  "marketing",
  "writing",
];

const SUBMISSION_STEPS = [
  {
    icon: PencilIcon,
    title: "You submit",
    body: "Title, prompt, sample output, tags. Two minutes, four fields.",
    accent: true,
  },
  {
    icon: ClockIcon,
    title: "We review",
    body: "Real humans, usually within 24 hours. We test every prompt.",
    accent: false,
  },
  {
    icon: SparklesIcon,
    title: "It goes live",
    body: "Public on CopyPrompt with your attribution. Email confirms.",
    accent: false,
  },
] as const;

const TIPS = [
  {
    icon: TargetIcon,
    title: "Be specific in the title",
    body: '"Validate a startup idea" beats "good business prompt" every time.',
  },
  {
    icon: WandSparklesIcon,
    title: "Show what it does",
    body: "Paste a real sample output — that's what sells the prompt.",
  },
  {
    icon: ZapIcon,
    title: "Tag thoughtfully",
    body: "Three precise tags beat ten lazy ones. Helps people find it.",
  },
] as const;

export default async function SubmitPage() {
  const user = await requireUser();

  const [models, categories, dbTags] = await Promise.all([
    getModelsForSelect(),
    getCategoriesForSelect(),
    getPopularTags(),
  ]);

  const tagSuggestions = Array.from(new Set([...dbTags, ...STARTER_TAGS]));
  const displayName = user.fullName ?? user.email.split("@")[0];

  return (
    <section className="relative">
      {/* Single subtle top spotlight — no orb / grid so the form
          stays a stable 60fps surface while typing. */}
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        {/* ─ Two-column grid — same DNA as /signin and /signup ─
            Wrapper width capped at 1080px (not the full 1280 container)
            so the form and the right column sit close together — no
            "two islands separated by an ocean" effect on wide screens.

            Columns: form takes the rest (minmax(0,1fr)) — capped at
            ~620px once you do the math — and the right rail is a
            fixed 340px on lg, growing to 360px from xl onward.

            Below lg the grid collapses to one column and the form is
            free to fill the container, with the right rail hidden. */}
        <div className="mx-auto grid max-w-[1080px] gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
          {/* ─── LEFT — Hero + Form ───────────────────────── */}
          {/* max-w-xl applies on mobile/sm where there's no grid; on lg+
              the grid track gives the column its width so we lift the
              cap (lg:max-w-none). */}
          <div className="max-w-xl lg:max-w-none">
            <header className="mb-8 md:mb-10">
              <p className="text-[12px] font-medium text-muted-foreground">
                Hey <span className="text-foreground">{displayName}</span> 
              </p>
              <h1 className="mt-2 text-balance text-[clamp(1.875rem,4vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.035em] text-foreground">
                Submit a prompt.
              </h1>
              <p className="mt-2.5 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Four fields. Two minutes. We review within 24 hours.
              </p>
            </header>

            <SubmitForm
              models={models}
              categories={categories}
              tagSuggestions={tagSuggestions}
            />
          </div>

          {/* ─── RIGHT — Showcase panel (lg+ only) ────────── */}
          <aside
            aria-hidden="true"
            className="hidden lg:block"
          >
            {/* Sticky so the panel travels with the form as the
                user scrolls through long prompt + tag input —
                stays at top: 5rem to clear the global Header.
                space-y-4 tightens the inter-panel gap so the two
                cards read as one cohesive support column. */}
            <div className="sticky top-20 space-y-4">
              {/* ── Submission flow timeline ─────────────── */}
              <div className="reveal rounded-xl border border-border bg-card/60 p-5 shadow-soft backdrop-blur-md">
                <p className="eyebrow mb-4">How submissions work</p>
                <ol className="relative space-y-4 pl-7">
                  {/* Vertical timeline rail */}
                  <span
                    aria-hidden
                    className="absolute top-2 bottom-2 left-[14px] w-px bg-border"
                  />
                  {SUBMISSION_STEPS.map((step, idx) => (
                    <li key={step.title} className="relative">
                      <span
                        aria-hidden
                        className={`absolute -left-7 top-0 grid size-7 place-items-center rounded-full border ${
                          step.accent
                            ? "border-primary/40 bg-primary text-primary-foreground shadow-soft"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        <step.icon className="size-3.5" />
                      </span>
                      <p className="text-[13.5px] font-semibold tracking-[-0.005em] text-foreground">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                      {/* Step counter — quiet rank, not a badge */}
                      <span
                        aria-hidden
                        className="absolute -right-1 top-0 font-mono text-[10px] text-muted-foreground/40"
                      >
                        0{idx + 1}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* ── What we look for — quality cues + reassurance ─
                  The "no spam" line lives INSIDE this card as a
                  footnote instead of in its own orphan card.
                  One card, one column, no floating UI. */}
              <div className="reveal delay-1 rounded-xl border border-border bg-card/60 p-5 shadow-soft backdrop-blur-md">
                <p className="eyebrow mb-4">What we look for</p>
                <ul className="space-y-3.5">
                  {TIPS.map((tip) => (
                    <li key={tip.title} className="flex items-start gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <tip.icon className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold tracking-[-0.005em] text-foreground">
                          {tip.title}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                          {tip.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Reassurance — inlined as a divider note */}
                <div className="mt-5 flex items-start gap-2.5 border-t border-border/50 pt-4">
                  <CheckCircle2Icon
                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    <span className="text-foreground">No spam.</span>{" "}
                    We&apos;ll only email you about <em>this</em> submission —
                    never a newsletter, never a promo.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
