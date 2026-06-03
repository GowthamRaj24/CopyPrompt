"use client";

import { AlertTriangleIcon } from "lucide-react";
import { useState } from "react";
import { GenerateInputCard } from "./GenerateInputCard";
import { GenerationResultCard } from "./GenerationResultCard";
import { GenerationSkeleton } from "./GenerationSkeleton";
import { useGenerator } from "./useGenerator";

/**
 * Self-contained generator unit: input → skeleton → result/error.
 *
 * Plug it anywhere a signed-in user might want to generate a prompt.
 * Caller passes the quota number from the server; everything else
 * (state, network, UX transitions) is owned here.
 */

interface GeneratorCoreProps {
  /** -1 means unlimited / admin. */
  initialQuotaRemaining: number;
  /** Pre-filled description (e.g. user's failed search query). */
  initialDescription?: string;
  /** Example chips shown under the textarea. */
  examples?: ReadonlyArray<string>;
  /** "hero" for /generate page; "compact" for inline / sidebars. */
  variant?: "hero" | "compact";
  /** Right-aligned hint inside the input header (overrides quota badge). */
  rightHint?: React.ReactNode;
  /** Hide the "Generate another" reset button on the result card. */
  showResultReset?: boolean;
}

const DEFAULT_EXAMPLES: ReadonlyArray<string> = [
  "Help me write a professional LinkedIn post about a job change",
  "A code review prompt that catches subtle bugs in TypeScript",
  "Midjourney prompt for a moody cyberpunk detective at dusk",
  "Onboard a new engineer to my codebase in a 30-day plan",
];

export function GeneratorCore({
  initialQuotaRemaining,
  initialDescription = "",
  examples = DEFAULT_EXAMPLES,
  variant = "hero",
  rightHint,
  showResultReset = true,
}: GeneratorCoreProps) {
  const [description, setDescription] = useState(initialDescription);
  const {
    status,
    result,
    errorMessage,
    quotaRemaining,
    unlimited,
    blockedByQuota,
    generate,
    reset,
  } = useGenerator({ initialQuotaRemaining });

  function handleSubmit() {
    void generate(description);
  }

  function handleReset() {
    reset();
    setDescription("");
  }

  // Build the right-hint slot (quota badge) if caller didn't pass one.
  const defaultHint = unlimited ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
      ∞ Admin
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
        quotaRemaining <= 3
          ? "border-amber-500/35 bg-amber-500/10 text-amber-500"
          : "border-border/60 bg-card/60 text-muted-foreground"
      }`}
    >
      {quotaRemaining} left today
    </span>
  );

  return (
    <div className="space-y-5">
      <GenerateInputCard
        description={description}
        onChange={setDescription}
        onSubmit={handleSubmit}
        isLoading={status === "loading"}
        isDisabled={blockedByQuota}
        examples={!result && status !== "loading" ? examples : []}
        rightHint={rightHint ?? defaultHint}
        variant={variant}
      />

      {/* ── Error ─────────────────────────────────────────── */}
      {status === "error" && errorMessage && (
        <div
          role="alert"
          className="reveal flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/[0.05] px-4 py-3 text-[13px] text-destructive"
        >
          <AlertTriangleIcon
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={2}
          />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* ── Skeleton during generation ────────────────────── */}
      {status === "loading" && <GenerationSkeleton />}

      {/* ── Result ────────────────────────────────────────── */}
      {status === "done" && result && (
        <GenerationResultCard
          result={result}
          showReset={showResultReset}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
