import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { requireUser } from "@/server/lib/auth";
import {
  getCategoriesForSelect,
  getModelsForSelect,
  getPopularTags,
} from "@/server/services/submission.service";
import { SubmitForm } from "./components/SubmitForm";
import { SubmitStepNav } from "./components/SubmitStepNav";

export const metadata: Metadata = {
  title: "Submit a prompt",
  description:
    "Create and share AI prompts — public catalog or instant private link.",
};

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
    <div className="submit-studio relative min-h-screen">
      <div className="submit-studio-ambient" aria-hidden />
      <div
        aria-hidden
        className="submit-studio-grid pointer-events-none absolute inset-0"
      />

      {/* Cinematic hero */}
      <header className="relative border-b border-border/40">
        <div className="container relative mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/"
            className="press mb-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to browse
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
                Prompt studio
              </p>
              <h1 className="mt-3 text-balance text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em]">
                Create. Share.{" "}
                <span className="text-gradient-flow">Grow.</span>
              </h1>
              <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
                Welcome,{" "}
                <span className="font-medium text-foreground">{displayName}</span>
                . Build a prompt for the public catalog or ship a private link
                in seconds.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <StatPill label="Fields" value="~5 min" />
              <StatPill label="Private" value="Instant" />
              <StatPill label="Public" value="~24h review" />
            </div>
          </div>
        </div>
      </header>

      {/* Studio workspace */}
      <div className="container relative mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <SubmitStepNav />
          <SubmitForm
            models={models}
            categories={categories}
            tagSuggestions={tagSuggestions}
          />
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="ml-2 text-[13px] font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}
