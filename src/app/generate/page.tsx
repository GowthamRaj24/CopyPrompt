import { SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import { RATE_LIMITS } from "@/server/config/constants";
import { requireUser } from "@/server/lib/auth";
import { getRemainingQuotaToday } from "@/server/services/prompt-generator.service";
import { GeneratorClient } from "./components/GeneratorClient";

export const metadata: Metadata = {
  title: "Generate a prompt",
  description:
    "Describe what you want help with and we'll generate a production-ready AI prompt — ready to copy into ChatGPT, Claude, Gemini, Midjourney and more.",
  alternates: { canonical: "/generate" },
};

// Force dynamic so the per-user quota number is always live.
export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const user = await requireUser();

  const remaining = await getRemainingQuotaToday(user.id, user.plan);
  const dailyLimit =
    user.plan === "premium"
      ? RATE_LIMITS.GENERATE_PREMIUM_PER_DAY
      : RATE_LIMITS.GENERATE_FREE_PER_DAY;

  const isUnlimited = remaining === Number.POSITIVE_INFINITY;

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal mb-8 flex flex-col gap-4 border-b border-border pb-6 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Generate</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary md:size-12">
                <SparklesIcon className="size-4 md:size-5" strokeWidth={2} />
              </span>
              Prompt generator
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground md:text-[14px]">
              Tell us what you're trying to do. We&apos;ll give you a
              production-ready prompt to paste straight into your AI tool.
            </p>
          </div>

          {/* Quota badge */}
          <div className="rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Today
            </p>
            <p className="font-mono text-[15px] font-bold tabular-nums text-foreground">
              {isUnlimited ? "∞" : `${remaining} / ${dailyLimit}`}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isUnlimited ? "Admin tier" : "Generations left"}
            </p>
          </div>
        </header>

        <GeneratorClient initialQuotaRemaining={isUnlimited ? -1 : remaining} />
      </div>
    </section>
  );
}
