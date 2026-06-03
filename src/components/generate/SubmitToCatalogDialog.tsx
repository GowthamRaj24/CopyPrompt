"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PlusIcon,
  RocketIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { isTurnstileEnabled, Turnstile } from "@/components/captcha/Turnstile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { slugifyTag } from "@/server/validators/submission.validator";

/**
 * Inline "Submit to catalog" dialog.
 *
 * Replaces the previous `/submit?title=…` deep-link with a same-page
 * modal that:
 *   1. Pre-fills title, prompt, model, category, tips from the just-
 *      generated result (zero retyping for the user).
 *   2. Asks ONLY for the missing required field:
 *         text  → expectedOutcome (sample output, ≥20 chars)
 *         image → 1-3 https URLs of example outputs
 *   3. Optionally lets the user add tags + edit title / tips.
 *   4. POSTs to `/api/submit` with the captcha token if Turnstile is on.
 *   5. Shows in-modal success state with a link to the user's queued
 *      submissions, then auto-closes after a delay.
 *
 * The component handles its own state — open/close, validation, error
 * banner, success state, captcha. Caller only renders it with the
 * generated data and an `open` controller.
 */

const IMAGE_SLUGS = new Set([
  "flux-dev",
  "flux-schnell",
  "flux-pro",
  "flux-kontext",
  "midjourney",
  "stable-diffusion-xl",
  "stable-diffusion-3",
  "dall-e-3",
  "ideogram",
  "leonardo-ai",
  "adobe-firefly",
  "imagen",
  "recraft",
]);

const CATEGORY_LABELS: Record<string, string> = {
  "validation-strategy": "Validation & Strategy",
  "coding-development": "Coding & Development",
  "writing-content": "Writing & Content",
  "marketing-sales": "Marketing & Sales",
  "analysis-research": "Analysis & Research",
  productivity: "Productivity",
  "learning-education": "Learning & Education",
  "personal-career": "Personal & Career",
  "image-generation": "Image Generation",
  "cinematic-portraits": "Cinematic Portraits",
  "product-photography": "Product Photography",
  "logo-design": "Logo Design",
  "anime-illustration": "Anime & Illustration",
  "fantasy-characters": "Fantasy Characters",
  architecture: "Architecture",
  "abstract-art": "Abstract Art",
};

export interface SubmitToCatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: {
    title: string;
    prompt: string;
    modelSlug: string;
    categorySlug: string;
    tips: string;
  };
}

export function SubmitToCatalogDialog({
  open,
  onOpenChange,
  initial,
}: SubmitToCatalogDialogProps) {
  const inferredType: "image" | "text" = IMAGE_SLUGS.has(initial.modelSlug)
    ? "image"
    : "text";

  // ── Form state (pre-filled from the generation) ──────────
  const [title, setTitle] = useState(initial.title);
  const [promptText, setPromptText] = useState(initial.prompt);
  const [tips, setTips] = useState(initial.tips);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  // ── Async / UX state ────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const captchaRequired = isTurnstileEnabled();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Reset everything when the dialog re-opens with fresh data.
  useEffect(() => {
    if (!open) return;
    setTitle(initial.title);
    setPromptText(initial.prompt);
    setTips(initial.tips);
    setTags([]);
    setTagDraft("");
    setExpectedOutcome("");
    setImageUrls([""]);
    setSubmitting(false);
    setSubmitted(false);
    setErrorMessage(null);
    setCaptchaToken(null);
  }, [open, initial]);

  function addTag(raw: string) {
    const slug = slugifyTag(raw);
    if (!slug) return;
    if (tags.includes(slug)) return;
    if (tags.length >= 5) {
      toast.error("Max 5 tags");
      return;
    }
    setTags((prev) => [...prev, slug]);
    setTagDraft("");
  }

  function removeTag(slug: string) {
    setTags((prev) => prev.filter((t) => t !== slug));
  }

  // ── Client-side validation mirrors submission.validator.ts so the
  //     user gets instant feedback before paying for an HTTP round-trip.
  const validationError = useMemo<string | null>(() => {
    if (title.trim().length < 10) return "Title must be at least 10 characters.";
    if (title.trim().length > 80) return "Title must be 80 characters or less.";
    if (promptText.trim().length < 20)
      return "Prompt must be at least 20 characters.";
    if (promptText.trim().length > 5_000)
      return "Prompt must be 5000 characters or less.";
    if (tips.length > 1_000) return "Tips must be 1000 characters or less.";
    if (inferredType === "text") {
      if (expectedOutcome.trim().length < 20)
        return "Add a sample output of at least 20 characters.";
      if (expectedOutcome.trim().length > 5_000)
        return "Sample output is too long (max 5000 characters).";
    } else {
      const urls = imageUrls.map((u) => u.trim()).filter(Boolean);
      if (urls.length === 0)
        return "Add at least one https image URL of an example output.";
      const invalid = urls.find((u) => !/^https:\/\//.test(u));
      if (invalid) return "Image URLs must start with https://.";
      if (urls.length > 3) return "Maximum 3 image URLs.";
    }
    return null;
  }, [title, promptText, tips, expectedOutcome, imageUrls, inferredType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    if (captchaRequired && !captchaToken) {
      setErrorMessage("Captcha is still loading — give it a second.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const body: Record<string, unknown> = {
      type: inferredType,
      title: title.trim(),
      promptText: promptText.trim(),
      modelSlug: initial.modelSlug,
      categorySlug: initial.categorySlug,
      tags,
      ...(tips.trim() ? { tips: tips.trim() } : {}),
      captchaToken,
    };

    if (inferredType === "text") {
      body.expectedOutcome = expectedOutcome.trim();
    } else {
      body.imageUrls = imageUrls.map((u) => u.trim()).filter(Boolean);
    }

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = (() => {
          if (data?.error) return data.error;
          if (res.status === 401) return "You need to sign in to submit.";
          if (res.status === 400) return "Some details look off — please review.";
          return "Couldn't submit. Try again in a moment.";
        })();
        setErrorMessage(msg);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      toast.success("Submitted for review", {
        description: "We'll notify you when it's approved.",
      });
      // Auto-close after 2s so the user sees the success state.
      setTimeout(() => onOpenChange(false), 2_000);
    } catch {
      setErrorMessage("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const modelLabel = initial.modelSlug;
  const categoryLabel =
    CATEGORY_LABELS[initial.categorySlug] ?? initial.categorySlug;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!submitted}
      >
        {/* ── Success state ─────────────────────────────── */}
        {submitted ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
              <CheckCircle2Icon className="size-7" strokeWidth={1.8} />
            </div>
            <DialogTitle className="text-xl font-bold tracking-[-0.02em]">
              Submitted for review
            </DialogTitle>
            <DialogDescription className="mt-2 text-[13px] text-muted-foreground">
              We&apos;ll email you when it&apos;s approved (usually within 24h).
            </DialogDescription>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Link
                href="/account#my-prompts"
                className="press inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-[13px] font-medium transition-colors hover:border-foreground/30 hover:bg-muted"
                onClick={() => onOpenChange(false)}
              >
                View my submissions
              </Link>
              <Button
                type="button"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Form ─────────────────────────────────── */}
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-[1.05rem] font-bold tracking-[-0.01em] md:text-[1.15rem]">
                <RocketIcon className="size-4 text-primary" strokeWidth={2} />
                Submit to the public catalog
              </DialogTitle>
              <DialogDescription className="text-[12.5px] text-muted-foreground">
                Pre-filled from your generation. Just add a{" "}
                {inferredType === "text" ? "sample output" : "few example images"}{" "}
                and we&apos;ll review within 24 hours.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-2 space-y-4">
              {/* Pre-filled summary — model + category chips */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-[11.5px]">
                <span className="font-mono uppercase tracking-wider text-muted-foreground/80">
                  Detected
                </span>
                <span className="rounded-md border border-border/50 bg-card/80 px-1.5 py-0.5 font-medium">
                  <span
                    aria-hidden
                    className={`mr-1 inline-block size-1.5 rounded-full ${
                      inferredType === "image"
                        ? "bg-blue-400"
                        : "bg-emerald-400"
                    } align-middle`}
                  />
                  {modelLabel}
                </span>
                <span aria-hidden className="text-muted-foreground/50">
                  ·
                </span>
                <span className="rounded-md border border-border/50 bg-card/80 px-1.5 py-0.5 font-medium">
                  {categoryLabel}
                </span>
              </div>

              {/* Title */}
              <Field
                label="Title"
                hint={`${title.length}/80`}
                htmlFor="sub-title"
              >
                <Input
                  id="sub-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  required
                />
              </Field>

              {/* Prompt — collapsed by default for visual breathing room */}
              <Field
                label="Prompt"
                hint={`${promptText.length}/5000`}
                htmlFor="sub-prompt"
              >
                <Textarea
                  id="sub-prompt"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={4}
                  maxLength={5_000}
                  required
                  className="font-mono text-[12.5px] leading-relaxed"
                />
              </Field>

              {/* Type-specific required field */}
              {inferredType === "text" ? (
                <Field
                  label="Sample output"
                  required
                  hint={`${expectedOutcome.length}/5000`}
                  htmlFor="sub-outcome"
                  helper="Run the prompt once and paste a real example of what the AI returns. This is what convinces other users to try your prompt."
                >
                  <Textarea
                    id="sub-outcome"
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    placeholder="Paste the AI's response when you ran this prompt with real inputs…"
                    rows={5}
                    maxLength={5_000}
                    required
                  />
                </Field>
              ) : (
                <ImageUrlsField
                  values={imageUrls}
                  onChange={setImageUrls}
                />
              )}

              {/* Tips */}
              <Field
                label="Tips (optional)"
                hint={`${tips.length}/1000`}
                htmlFor="sub-tips"
                helper="One sentence on how to get the best results."
              >
                <Textarea
                  id="sub-tips"
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                  rows={2}
                  maxLength={1_000}
                />
              </Field>

              {/* Tags */}
              <Field
                label={`Tags (optional, max 5)`}
                hint={`${tags.length}/5`}
                htmlFor="sub-tag-draft"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11.5px] font-medium text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove ${tag}`}
                        className="grid size-3.5 place-items-center rounded-full hover:bg-primary/20"
                      >
                        <XIcon className="size-2.5" />
                      </button>
                    </span>
                  ))}
                  <Input
                    id="sub-tag-draft"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagDraft);
                      }
                      if (
                        e.key === "Backspace" &&
                        tagDraft === "" &&
                        tags.length > 0
                      ) {
                        removeTag(tags[tags.length - 1] ?? "");
                      }
                    }}
                    placeholder={
                      tags.length >= 5
                        ? "Tag limit reached"
                        : "Type and press Enter…"
                    }
                    disabled={tags.length >= 5}
                    className="h-8 flex-1 min-w-[140px] border-0 bg-transparent px-2 text-[12.5px] shadow-none focus-visible:ring-0"
                  />
                </div>
              </Field>

              {/* Captcha — only if Turnstile is configured */}
              {captchaRequired && (
                <div>
                  <Turnstile
                    onVerify={setCaptchaToken}
                    action="submit-prompt-inline"
                  />
                </div>
              )}

              {/* Error */}
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.05] px-3 py-2 text-[12.5px] text-destructive"
                >
                  <AlertTriangleIcon
                    className="mt-0.5 size-3.5 shrink-0"
                    strokeWidth={2}
                  />
                  <span>{errorMessage}</span>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    Boolean(validationError) ||
                    (captchaRequired && !captchaToken)
                  }
                  className="gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <RocketIcon className="size-3.5" />
                      Submit for review
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function Field({
  label,
  hint,
  required,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
        {hint && (
          <span className="font-mono text-[10.5px] text-muted-foreground/70 tabular-nums">
            {hint}
          </span>
        )}
      </div>
      {children}
      {helper && (
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}

function ImageUrlsField({
  values,
  onChange,
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const canAdd = values.length < 3;

  function setAt(idx: number, value: string) {
    onChange(values.map((v, i) => (i === idx ? value : v)));
  }
  function removeAt(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }
  function addEmpty() {
    if (!canAdd) return;
    onChange([...values, ""]);
  }

  return (
    <Field
      label="Sample images"
      required
      hint={`${values.filter((v) => v.trim()).length}/3`}
      helper="Paste up to 3 https URLs of example outputs. Run your prompt in Midjourney/Flux/DALL-E and upload the results to any host (Discord, Imgur, R2, Supabase Storage)."
    >
      <div className="space-y-2">
        {values.map((value, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <Input
              value={value}
              onChange={(e) => setAt(idx, e.target.value)}
              placeholder="https://…/image.png"
              type="url"
              required={idx === 0}
            />
            {values.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAt(idx)}
                aria-label={`Remove image URL ${idx + 1}`}
                className="size-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
              >
                <XIcon className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
        {canAdd && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addEmpty}
            className="h-8 gap-1.5 text-[12px]"
          >
            <PlusIcon className="size-3.5" />
            Add another image URL
          </Button>
        )}
      </div>
    </Field>
  );
}
