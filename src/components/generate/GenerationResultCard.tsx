"use client";

import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  ImageIcon,
  LightbulbIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getModelLauncher } from "@/lib/model-launchers";
import { SubmitToCatalogDialog } from "./SubmitToCatalogDialog";
import type { GenerationResult } from "./useGenerator";

/**
 * Result card for a single generated prompt.
 *
 * Used by BOTH the `/generate` page and the inline generator on
 * `/search`, so it doesn't assume a parent layout. The card brings its
 * own border, background, and ornament glow.
 *
 * Action row in priority order:
 *   1. Copy             — the only must-have
 *   2. Open in model    — one-click handoff if the model exposes a deep link
 *   3. Submit to catalog — pre-fills /submit (closes the loop into the public catalog)
 *   4. Generate another — only relevant on the /generate page; hide elsewhere
 */

interface GenerationResultCardProps {
  result: GenerationResult;
  /** Show "Generate another" reset action. Defaults to true. */
  showReset?: boolean;
  onReset?: () => void;
}

export function GenerationResultCard({
  result,
  showReset = true,
  onReset,
}: GenerationResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const launcher = getModelLauncher(result.modelSlug);
  const isImageModel = isImageModelSlug(result.modelSlug);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      toast.success("Prompt copied");
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  return (
    <article
      className="result-card reveal relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-card/80 via-card/65 to-card/45 p-5 shadow-[0_0_0_1px_oklch(0.66_0.21_270/0.18),0_22px_44px_-22px_oklch(0.66_0.21_270/0.35)] backdrop-blur-md md:p-7"
      aria-label="Generated prompt result"
    >
      {/* Ambient corner glows */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-primary/15 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-[#3B82F6]/12 blur-3xl"
      />
      {/* Thin top gradient line */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
      />

      {/* ── Header ───────────────────────────────────────── */}
      <header className="relative flex items-start justify-between gap-3 border-b border-border/40 pb-5">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
            <SparklesIcon className="size-3 text-primary" strokeWidth={2.4} />
            Generated for you
          </p>
          <h2 className="text-balance text-[1.25rem] font-bold leading-[1.15] tracking-[-0.02em] md:text-[1.5rem]">
            <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              {result.title}
            </span>
          </h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11.5px]">
            <ModelPill modelSlug={result.modelSlug} isImage={isImageModel} />
            <span aria-hidden className="text-muted-foreground/50">
              ·
            </span>
            <Link
              href={`/category/${result.categorySlug}`}
              className="rounded-md bg-muted/60 px-1.5 py-0.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {result.categorySlug.replace(/-/g, " ")}
            </Link>
            <span aria-hidden className="text-muted-foreground/50">
              ·
            </span>
            <span className="font-mono text-[10.5px] text-muted-foreground/80 tabular-nums">
              {formatMs(result.generatedInMs)}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="default"
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
      </header>

      {/* ── Prompt body ─────────────────────────────────── */}
      <div className="relative mt-5">
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          The prompt
        </p>
        <div className="relative">
          <pre
            className="max-h-[460px] overflow-auto rounded-xl border border-border/40 bg-[oklch(0.13_0.008_264)] p-5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap break-words text-foreground/90 dark:bg-[oklch(0.11_0.008_264)] result-prompt-scroll"
            aria-label="Generated prompt text"
          >
            {result.prompt}
          </pre>
          {/* Window-chrome dots top-left */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-3 left-4 flex gap-1.5"
          >
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="size-1.5 rounded-full bg-white/15" />
          </span>
          {/* Bottom fade — purely cosmetic */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-xl bg-gradient-to-t from-[oklch(0.13_0.008_264)] to-transparent dark:from-[oklch(0.11_0.008_264)]"
          />
        </div>
      </div>

      {/* ── Tip ─────────────────────────────────────────── */}
      {result.tips && (
        <div className="relative mt-4 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
            <LightbulbIcon className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-primary">
              Pro tip
            </p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-foreground/90">
              {result.tips}
            </p>
          </div>
        </div>
      )}

      {/* ── Action row ──────────────────────────────────── */}
      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        {launcher && (
          <a
            href={launcher.build(result.prompt)}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex h-9 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/15 px-3.5 text-[13px] font-semibold text-primary transition-all hover:border-primary/60 hover:bg-primary/25"
          >
            <ExternalLinkIcon className="size-3.5" strokeWidth={2.2} />
            {launcher.label}
          </a>
        )}
        <button
          type="button"
          onClick={() => setSubmitOpen(true)}
          className="press inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-[13px] font-medium transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
        >
          <RocketIcon className="size-3.5" strokeWidth={2.2} />
          Submit to catalog
        </button>
        {showReset && onReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="ml-auto gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCwIcon className="size-3.5" />
            Generate another
          </Button>
        )}
      </div>

      {/* Inline submission dialog — opens on "Submit to catalog" click.
          Pre-fills everything from the generation and only asks for the
          one missing required field (sample output for text prompts;
          image URLs for image prompts). Posts to /api/submit. */}
      <SubmitToCatalogDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        initial={{
          title: result.title,
          prompt: result.prompt,
          modelSlug: result.modelSlug,
          categorySlug: result.categorySlug,
          tips: result.tips,
        }}
      />
    </article>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function ModelPill({
  modelSlug,
  isImage,
}: {
  modelSlug: string;
  isImage: boolean;
}) {
  const Icon = isImage ? ImageIcon : MessageSquareIcon;
  return (
    <Link
      href={`/models/${modelSlug}`}
      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/80 px-2 py-0.5 font-medium text-foreground/85 hover:border-primary/40 hover:bg-primary/[0.06]"
    >
      <Icon
        className={`size-3 ${isImage ? "text-blue-400" : "text-emerald-400"}`}
        strokeWidth={2}
      />
      {modelSlug}
    </Link>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function isImageModelSlug(slug: string): boolean {
  return (
    slug.startsWith("flux-") ||
    slug.startsWith("stable-diffusion") ||
    slug === "midjourney" ||
    slug === "dall-e-3" ||
    slug === "ideogram" ||
    slug === "leonardo-ai" ||
    slug === "adobe-firefly" ||
    slug === "imagen" ||
    slug === "recraft"
  );
}

function formatMs(ms: number): string {
  if (ms < 1_000) return `${ms} ms`;
  return `${(ms / 1_000).toFixed(1)}s`;
}
