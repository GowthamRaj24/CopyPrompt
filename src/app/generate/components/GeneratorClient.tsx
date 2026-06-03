"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Client-side generator UI.
 *
 * State
 * ─────
 *   - description    : the textarea content
 *   - status         : 'idle' | 'loading' | 'done' | 'error'
 *   - result         : last successful generation
 *   - errorMessage   : friendly error to render under the textarea
 *   - quotaRemaining : last-known remaining quota (updates after each call)
 *
 * Behaviour
 * ─────────
 *   - Submit on Enter (Cmd/Ctrl+Enter on the textarea).
 *   - Disable submit while loading or when quota = 0.
 *   - On success: show the generated prompt with Copy + "Submit to catalog" CTAs.
 *   - On rate-limit: friendly retry text + countdown when Retry-After is sent.
 */

interface GeneratorClientProps {
  /** -1 means unlimited / admin. */
  initialQuotaRemaining: number;
}

interface GenerateSuccess {
  ok: true;
  generationId: string;
  title: string;
  prompt: string;
  modelSlug: string;
  categorySlug: string;
  tips: string;
  quotaRemainingToday: number;
}

interface GenerateFailure {
  ok: false;
  reason: string;
  message: string;
  retryAfterSec?: number;
  quotaRemainingToday?: number;
}

type GenerateResponse = GenerateSuccess | GenerateFailure;

const EXAMPLES = [
  "Help me write a professional LinkedIn post about a job change",
  "I need a code review prompt that catches subtle bugs in TypeScript",
  "A Midjourney prompt for a moody cyberpunk detective at dusk",
  "Onboard a new engineer to my codebase in a first 30-day plan",
  "Generate a cold outbound email that doesn't feel like a cold email",
];

export function GeneratorClient({
  initialQuotaRemaining,
}: GeneratorClientProps) {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [result, setResult] = useState<GenerateSuccess | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState<number>(
    initialQuotaRemaining,
  );
  const [copied, setCopied] = useState(false);

  const unlimited = quotaRemaining === -1;
  const blockedByQuota = !unlimited && quotaRemaining <= 0;

  const submit = useCallback(async () => {
    const text = description.trim();
    if (text.length < 10) {
      setErrorMessage("Tell us a bit more — at least 10 characters.");
      return;
    }
    if (blockedByQuota) {
      setErrorMessage(
        "You've used your daily quota. Try again tomorrow or upgrade your plan.",
      );
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
        credentials: "include",
      });
      const data = (await res.json()) as GenerateResponse;

      if (data.ok) {
        setResult(data);
        setStatus("done");
        setQuotaRemaining(
          data.quotaRemainingToday === Number.POSITIVE_INFINITY
            ? -1
            : data.quotaRemainingToday,
        );
        toast.success("Prompt generated");
        return;
      }

      // Failure path.
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
  }, [description, blockedByQuota]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl+Enter submits without leaving the textarea.
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  async function copyPrompt() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      toast.success("Prompt copied");
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  function startOver() {
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
    setCopied(false);
    setDescription("");
  }

  // Build a pre-fill query string so "Submit to catalog" lands on
  // /submit with the title + body already filled in.
  const submitHref = result
    ? `/submit?title=${encodeURIComponent(result.title)}&promptText=${encodeURIComponent(result.prompt)}&modelSlug=${encodeURIComponent(result.modelSlug)}&categorySlug=${encodeURIComponent(result.categorySlug)}&tips=${encodeURIComponent(result.tips)}`
    : "/submit";

  return (
    <div className="space-y-6">
      {/* ── Input ─────────────────────────────────────────── */}
      <div className="reveal space-y-3">
        <label
          htmlFor="generate-description"
          className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          What do you want help with?
        </label>
        <Textarea
          id="generate-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          rows={5}
          placeholder="e.g. Help me write a friendly but firm follow-up email to a client who hasn't paid an invoice in 30 days."
          maxLength={2_000}
          className="min-h-[140px] resize-y text-[14px] leading-relaxed"
          disabled={status === "loading"}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
          <span className="font-mono">
            {description.length} / 2000 · ⌘/Ctrl+Enter to submit
          </span>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={status === "loading" || blockedByQuota}
            className="gap-2"
            size="sm"
          >
            {status === "loading" ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <SparklesIcon className="size-3.5" />
                Generate prompt
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Suggestions chips (only before any result) ───── */}
      {!result && status !== "loading" && (
        <div className="reveal flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/70">
            Try
          </span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setDescription(example)}
              className="press inline-flex items-center rounded-full border border-border/50 bg-card/50 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {errorMessage && status !== "loading" && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/[0.04] px-4 py-3 text-[13px] text-destructive"
        >
          {errorMessage}
        </div>
      )}

      {/* ── Result ───────────────────────────────────────── */}
      {result && status === "done" && (
        <div className="reveal rounded-2xl border border-border/60 bg-card/80 p-5 shadow-soft md:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
            <div className="min-w-0">
              <p className="eyebrow mb-1.5">Generated</p>
              <h2 className="line-clamp-2 text-[1.125rem] font-bold leading-tight tracking-[-0.02em] md:text-[1.25rem]">
                {result.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 font-medium">
                  <span aria-hidden className="size-1.5 rounded-full bg-emerald-400" />
                  {result.modelSlug}
                </span>
                <span aria-hidden>·</span>
                <span>{result.categorySlug}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyPrompt()}
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <CheckIcon className="size-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="size-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Generated prompt — read-only, scroll if long */}
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-border/40 bg-muted/30 p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
            {result.prompt}
          </pre>

          {/* Tip */}
          {result.tips && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.05] px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">
                Tip
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">
                {result.tips}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startOver}
              className="gap-1.5"
            >
              <RefreshCwIcon className="size-3.5" />
              Generate another
            </Button>
            <Link
              href={submitHref}
              className="press inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[13px] font-medium transition-colors hover:border-foreground/30 hover:bg-muted"
            >
              Submit to catalog
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
