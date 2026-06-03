"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Generator state machine + `/api/generate` call.
 *
 * Exposed as a hook so the SAME logic powers:
 *   - the full `/generate` page
 *   - the inline generator on `/search` results
 *
 * Both surfaces share the result card UI and skeleton component, so
 * keeping the orchestration here means there's exactly one place to
 * tweak network behaviour, error mapping, or quota tracking.
 */

export interface GenerationResult {
  generationId: string;
  title: string;
  prompt: string;
  modelSlug: string;
  categorySlug: string;
  tips: string;
  quotaRemainingToday: number;
  /** Wall-clock duration of the round trip, in ms. UI-only signal. */
  generatedInMs: number;
}

export type GeneratorStatus = "idle" | "loading" | "done" | "error";

interface UseGeneratorOptions {
  /** -1 means unlimited. */
  initialQuotaRemaining: number;
}

interface ApiSuccess {
  ok: true;
  generationId: string;
  title: string;
  prompt: string;
  modelSlug: string;
  categorySlug: string;
  tips: string;
  quotaRemainingToday: number;
}

interface ApiFailure {
  ok: false;
  reason: string;
  message: string;
  retryAfterSec?: number;
  quotaRemainingToday?: number;
}

type ApiResponse = ApiSuccess | ApiFailure;

export function useGenerator({ initialQuotaRemaining }: UseGeneratorOptions) {
  const [status, setStatus] = useState<GeneratorStatus>("idle");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState<number>(
    initialQuotaRemaining,
  );
  const unlimited = quotaRemaining === -1;
  const blockedByQuota = !unlimited && quotaRemaining <= 0;

  const generate = useCallback(
    async (description: string) => {
      const text = description.trim();
      if (text.length < 10) {
        setStatus("error");
        setErrorMessage("Tell us a bit more — at least 10 characters.");
        return;
      }
      if (blockedByQuota) {
        setStatus("error");
        setErrorMessage(
          "You've used your daily quota. Try again tomorrow.",
        );
        return;
      }

      setStatus("loading");
      setErrorMessage(null);

      const startedAt = Date.now();
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: text }),
          credentials: "include",
        });
        const data = (await res.json()) as ApiResponse;

        if (data.ok) {
          setResult({
            generationId: data.generationId,
            title: data.title,
            prompt: data.prompt,
            modelSlug: data.modelSlug,
            categorySlug: data.categorySlug,
            tips: data.tips,
            quotaRemainingToday: data.quotaRemainingToday,
            generatedInMs: Date.now() - startedAt,
          });
          setStatus("done");
          setQuotaRemaining(
            data.quotaRemainingToday === Number.POSITIVE_INFINITY
              ? -1
              : data.quotaRemainingToday,
          );
          toast.success("Prompt generated", {
            description: data.title,
          });
          return;
        }

        setStatus("error");
        setErrorMessage(data.message);
        if (
          typeof data.quotaRemainingToday === "number" &&
          Number.isFinite(data.quotaRemainingToday)
        ) {
          setQuotaRemaining(data.quotaRemainingToday);
        }
      } catch {
        setStatus("error");
        setErrorMessage(
          "Network error. Check your connection and try again.",
        );
      }
    },
    [blockedByQuota],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  }, []);

  return {
    status,
    result,
    errorMessage,
    quotaRemaining,
    unlimited,
    blockedByQuota,
    generate,
    reset,
  };
}
