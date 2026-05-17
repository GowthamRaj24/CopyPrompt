"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ImageIcon,
  Loader2Icon,
  MessageSquareIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { isTurnstileEnabled, Turnstile } from "@/components/captcha/Turnstile";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/upload/ImageUploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type SubmissionInput,
  submissionSchema,
} from "@/server/validators/submission.validator";
import { TagInput } from "./TagInput";

interface SubmitFormProps {
  models: Array<{ slug: string; name: string; type: "image" | "text" }>;
  categories: Array<{ slug: string; name: string }>;
  /** Existing tags from DB for autocomplete suggestions */
  tagSuggestions: string[];
}

/**
 * SubmitForm — radically simplified.
 *
 * UX contract
 * ───────────
 * Four visible required fields, period:
 *   1. Title
 *   2. Prompt text
 *   3. Image URL (image type) OR Sample output (text type)
 *   4. Tags
 *
 * Model and Category are required by the backend but auto-selected
 * here using the first available option for the chosen prompt type.
 * Users who want to override can open the single "More options"
 * disclosure at the bottom.
 *
 * Removed from the previous version
 * ─────────────────────────────────
 *   - Sticky live-preview sidebar (heavy paint cost, distracting)
 *   - Section numbering + completion meter (gamification noise)
 *   - Character-meter bars (replaced with subtle live count)
 *   - Image params grid (aspect/steps/guidance/seed)
 *   - Text params grid (temperature/maxTokens/systemMessage)
 *   - Negative prompt field
 *   - Separate "Tips" field
 *   - Orb + grid backgrounds (paint cost)
 *
 * 60fps notes
 * ───────────
 *   - No `transition-all` on the page — only specific, GPU-cheap props
 *   - Tag chip enter is `transform/opacity` only (no width/height)
 *   - No animated progress bars (would trigger layout)
 *   - Textareas use modern `field-sizing: content` so resize is one paint
 */
export function SubmitForm({
  models,
  categories,
  tagSuggestions,
}: SubmitFormProps) {
  const router = useRouter();
  const [type, setType] = useState<"image" | "text">("image");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = isTurnstileEnabled();

  // Smart defaults for the always-required-but-rarely-changed fields.
  const defaultModelForType = useMemo(
    () => models.find((m) => m.type === "image")?.slug ?? "",
    [models],
  );
  const defaultCategory = useMemo(() => {
    // Prefer an "other" / "general" category as the universal default;
    // fall back to the first alphabetically.
    const universal = categories.find((c) =>
      ["other", "general", "misc"].includes(c.slug),
    );
    return (universal ?? categories[0])?.slug ?? "";
  }, [categories]);

  // RHF generic juggling for Zod schemas that transform (`.default([])`,
  // `.coerce.*`, etc.):
  //   - TFieldValues       = the INPUT type   (what RHF stores while you type)
  //   - TTransformedValues = the OUTPUT type  (what the resolver hands to
  //                          our `onSubmit` callback after validation)
  // Without this split, the resolver type and `useForm<T>` type don't
  // line up because Zod 4 propagates `tags?: string[]` on input but
  // `tags: string[]` on output. This is the official RHF-prescribed fix.
  type SubmissionFormValues = z.input<typeof submissionSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SubmissionFormValues, unknown, SubmissionInput>({
    // zodResolver's v5 typing widens `z.coerce.number()` inputs to `unknown`
    // and treats `.optional().default([])` as optional on input, which doesn't
    // line up with our discriminated-union variants. The runtime behaviour is
    // exactly what we want — only the static type needs nudging.
    resolver: zodResolver(submissionSchema) as unknown as Resolver<
      SubmissionFormValues,
      unknown,
      SubmissionInput
    >,
    defaultValues: {
      type: "image",
      title: "",
      promptText: "",
      modelSlug: defaultModelForType,
      categorySlug: defaultCategory,
      tags: [],
    },
    // Don't show "must be at least 20 characters" while the user is still
    // typing the FIRST character. Errors are only revealed on the first
    // submit attempt; after that we switch to onChange so fixing a field
    // clears its error live.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Live form state for inline counters + chip input
  const titleValue = watch("title") ?? "";
  const promptValue = watch("promptText") ?? "";
  const tags = watch("tags") ?? [];
  const modelSlug = watch("modelSlug");
  const categorySlug = watch("categorySlug");
  const expectedOutcomeValue =
    (watch("expectedOutcome" as never) as unknown as string | undefined) ?? "";

  // When user flips the type toggle, re-pick a sensible default model
  // for the new type so they never see an empty/invalid select.
  function handleTypeChange(newType: "image" | "text") {
    setType(newType);
    setValue("type", newType);
    const firstOfType = models.find((m) => m.type === newType);
    if (firstOfType) setValue("modelSlug", firstOfType.slug);
  }

  function handleImageUrlChange(idx: number, value: string) {
    const next = [...imageUrls];
    next[idx] = value;
    setImageUrls(next);
    setValue(
      "imageUrls" as never,
      next.filter((u) => u.trim().length > 0) as never,
      { shouldValidate: false },
    );
  }

  function addImageUrl() {
    if (imageUrls.length < 3) setImageUrls([...imageUrls, ""]);
  }

  function removeImageUrl(idx: number) {
    const next = imageUrls.filter((_, i) => i !== idx);
    setImageUrls(next.length > 0 ? next : [""]);
    setValue(
      "imageUrls" as never,
      next.filter((u) => u.trim().length > 0) as never,
      { shouldValidate: false },
    );
  }

  async function onSubmit(data: SubmissionInput) {
    if (captchaRequired && !captchaToken) {
      toast.error("Please complete the captcha challenge.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, captchaToken }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        toast.error("Submission failed", {
          description:
            errBody.error ?? "Please check your inputs and try again.",
        });
        setSubmitting(false);
        return;
      }

      const { id } = await res.json();
      reset();
      router.push(`/submit/thank-you?id=${id}`);
    } catch {
      toast.error("Network error", {
        description: "Couldn't reach the server. Please retry.",
      });
      setSubmitting(false);
    }
  }

  const selectedModel = models.find((m) => m.slug === modelSlug);
  const selectedCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* ── Type switch (segmented control) ─────────────── */}
      <TypeSwitch type={type} onChange={handleTypeChange} />

      {/* ── 1. Title ──────────────────────────────────── */}
      <Field
        label="Title"
        required
        error={errors.title?.message}
        counter={`${titleValue.length}/80`}
        counterAlert={
          titleValue.length > 0 && titleValue.length < 10
            ? "need 10+"
            : undefined
        }
      >
        <Input
          {...register("title")}
          maxLength={80}
          autoComplete="off"
          spellCheck="true"
          placeholder={
            type === "image"
              ? "Cinematic cyberpunk portrait"
              : "Validate a startup idea"
          }
          className="h-11 text-[15px]"
        />
      </Field>

      {/* ── 2. Prompt text ────────────────────────────── */}
      <Field
        label="Prompt"
        required
        hint="The exact text people will copy into the AI tool."
        error={errors.promptText?.message}
        counter={`${promptValue.length}/5000`}
        counterAlert={
          promptValue.length > 0 && promptValue.length < 20
            ? "need 20+"
            : undefined
        }
      >
        <Textarea
          {...register("promptText")}
          maxLength={5000}
          rows={6}
          className="autosize font-mono text-[13px] leading-relaxed"
          placeholder={
            type === "image"
              ? "moody neon-lit portrait of a cybernetic woman, rain-slick streets, blade runner aesthetic, ultra-detailed…"
              : "Act as an experienced startup advisor. I want to validate the following idea: {your_idea}…"
          }
        />
      </Field>

      {/* ── 3. Visual proof (per-type) ─────────────────── */}
      {type === "image" ? (
        <Field
          label="Image"
          required
          hint="Drop / upload up to 3 images, or paste public HTTPS links."
          error={
            (errors as { imageUrls?: { message?: string } }).imageUrls?.message
          }
        >
          <div className="space-y-3">
            {imageUrls.map((url, idx) => (
              <ImageSource
                key={idx}
                url={url}
                index={idx}
                canRemove={imageUrls.length > 1}
                onChange={(v) => handleImageUrlChange(idx, v)}
                onRemove={() => removeImageUrl(idx)}
              />
            ))}
            {imageUrls.length < 3 && (
              <button
                type="button"
                onClick={addImageUrl}
                className="press inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border/70 bg-card/30 px-3 text-[12px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary"
                style={{
                  transition: "color 150ms, border-color 150ms",
                }}
              >
                <PlusIcon className="size-3.5" />
                Add another image
              </button>
            )}
          </div>
        </Field>
      ) : (
        <Field
          label="Sample output"
          required
          hint="What the AI returns when this prompt runs. Sells the value."
          error={
            (errors as { expectedOutcome?: { message?: string } })
              .expectedOutcome?.message
          }
          counter={`${expectedOutcomeValue.length}/5000`}
          counterAlert={
            expectedOutcomeValue.length > 0 && expectedOutcomeValue.length < 20
              ? "need 20+"
              : undefined
          }
        >
          <Textarea
            {...register("expectedOutcome" as never)}
            maxLength={5000}
            rows={4}
            className="autosize text-[13px] leading-relaxed"
            placeholder="Top 3 risks:&#10;1. Market too small…&#10;2. Solving a problem people don't pay for…&#10;3. The 10x claim is unprovable…"
          />
        </Field>
      )}

      {/* ── 4. Tags ─────────────────────────────────── */}
      <Field
        label="Tags"
        hint="How people will find it. Add up to 5."
        error={errors.tags?.message}
      >
        <TagInput
          value={tags}
          onChange={(next) =>
            setValue("tags", next, { shouldValidate: true })
          }
          suggestions={tagSuggestions}
          popularSuggestions={tagSuggestions.slice(0, 10)}
          maxTags={5}
          placeholder={
            type === "image"
              ? "cinematic, portrait, neon…"
              : "advisor, validation, business…"
          }
        />
      </Field>

      {/* ── More options (model + category) ──────────── */}
      <MoreOptions
        open={moreOpen}
        onToggle={() => setMoreOpen((v) => !v)}
        modelName={selectedModel?.name}
        categoryName={selectedCategory?.name}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldLite label="Model" error={errors.modelSlug?.message}>
            <Select
              onValueChange={(v) =>
                setValue("modelSlug", v, { shouldValidate: true })
              }
              value={modelSlug || undefined}
            >
              <SelectTrigger className="!h-10 !w-full">
                <SelectValue placeholder="Pick a model" />
              </SelectTrigger>
              <SelectContent>
                {models
                  .filter((m) => m.type === type)
                  .map((m) => (
                    <SelectItem key={m.slug} value={m.slug}>
                      {m.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FieldLite>

          <FieldLite label="Category" error={errors.categorySlug?.message}>
            <Select
              onValueChange={(v) =>
                setValue("categorySlug", v, { shouldValidate: true })
              }
              value={categorySlug || undefined}
            >
              <SelectTrigger className="!h-10 !w-full">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldLite>
        </div>
      </MoreOptions>

      {/* ── Captcha (invisible when keys are unset) ─── */}
      {captchaRequired && (
        <div className="flex justify-center">
          <Turnstile onVerify={setCaptchaToken} action="submit-prompt" />
        </div>
      )}

      {/* ── Submit ────────────────────────────────────── */}
      <SubmitButton
        submitting={submitting}
        disabled={captchaRequired && !captchaToken}
      />

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground/70">
        Reviewed within 24 hours · We&apos;ll email you when it&apos;s live.
      </p>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Type switch — pill segmented control (GPU-cheap)
   ═══════════════════════════════════════════════════════════════ */

function TypeSwitch({
  type,
  onChange,
}: {
  type: "image" | "text";
  onChange: (t: "image" | "text") => void;
}) {
  // Single relative wrapper with TWO equal grid columns. The indicator
  // is absolutely positioned at 50% width inset 0.25rem from the left,
  // and slides exactly its own width to the right when text is active.
  // Always full-width — auto-sizing made the columns drift apart when
  // labels had different character counts, leaving the indicator
  // misaligned on the wider button.
  return (
    <div
      role="tablist"
      aria-label="Prompt type"
      className="relative grid w-full grid-cols-2 rounded-xl border border-border/60 bg-card/40 p-1"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-primary shadow-soft"
        style={{
          transform: type === "image" ? "translateX(0)" : "translateX(100%)",
          transition: "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
      />
      <TypeButton
        active={type === "image"}
        onClick={() => onChange("image")}
        icon={<ImageIcon className="size-3.5" strokeWidth={2} />}
        label="Image prompt"
      />
      <TypeButton
        active={type === "text"}
        onClick={() => onChange("text")}
        icon={<MessageSquareIcon className="size-3.5" strokeWidth={2} />}
        label="Text prompt"
      />
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`relative z-[1] inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-medium ${
        active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
      style={{ transition: "color 200ms" }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Field — label + control + hint/error + inline char counter
   ═══════════════════════════════════════════════════════════════ */

function Field({
  label,
  hint,
  error,
  required,
  counter,
  counterAlert,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Right-aligned soft counter, e.g. "12/80" */
  counter?: string;
  /** When set, paints the counter in destructive color */
  counterAlert?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="flex items-center gap-1 text-[12.5px] font-medium text-foreground/90"
        >
          {label}
          {required && (
            <span className="text-primary" aria-label="required">
              *
            </span>
          )}
        </label>
        {counter && (
          <span
            className={`text-[11px] tabular-nums ${
              counterAlert ? "text-destructive" : "text-muted-foreground/60"
            }`}
          >
            {counterAlert ? `${counterAlert} · ${counter}` : counter}
          </span>
        )}
      </div>
      <div id={id}>{children}</div>
      {error ? (
        <p className="mt-1.5 text-[12px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Minimal field for inside the More-options disclosure */
function FieldLite({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">
        {label}
      </p>
      {children}
      {error && (
        <p className="mt-1.5 text-[12px] text-destructive">{error}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ImageSource — single row supporting both file upload and URL paste
   ═══════════════════════════════════════════════════════════════ */

function ImageSource({
  url,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  url: string;
  index: number;
  canRemove: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
}) {
  // If the row already has a URL that isn't a Supabase Storage upload,
  // default to "URL" mode so the user sees what they typed. Otherwise
  // default to "Upload" because that's the recommended path.
  const isStorageUrl =
    url.includes(".supabase.co/storage/") ||
    url.includes(".supabase.in/storage/");
  const [mode, setMode] = useState<"upload" | "url">(
    url && !isStorageUrl ? "url" : "upload",
  );
  const [thumbOk, setThumbOk] = useState(true);
  const hasValidUrl = url.startsWith("https://") && url.length > 10;

  useEffect(() => {
    if (hasValidUrl) setThumbOk(true);
  }, [hasValidUrl]);

  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
          Image {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <ModeChip
            active={mode === "upload"}
            onClick={() => setMode("upload")}
          >
            Upload
          </ModeChip>
          <ModeChip active={mode === "url"} onClick={() => setMode("url")}>
            URL
          </ModeChip>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove image ${index + 1}`}
              className="press ml-1 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              style={{ transition: "color 150ms, background-color 150ms" }}
            >
              <Trash2Icon className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {mode === "upload" ? (
        <ImageUploader
          onUploaded={onChange}
          initialUrl={url || undefined}
          placeholder="Drop, click, or paste an image"
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/60 bg-muted/30">
            {hasValidUrl && thumbOk ? (
              // biome-ignore lint/performance/noImgElement: external preview
              <img
                src={url}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
                onError={() => setThumbOk(false)}
              />
            ) : (
              <span className="font-mono text-[10px] text-muted-foreground/50">
                #{index + 1}
              </span>
            )}
          </div>
          <Input
            type="url"
            value={url}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… (paste a public link)"
            className="h-10 flex-1"
          />
        </div>
      )}
    </div>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`press h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   More options — single collapsible at the bottom
   ═══════════════════════════════════════════════════════════════ */

function MoreOptions({
  open,
  onToggle,
  modelName,
  categoryName,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  modelName?: string;
  categoryName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/30">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1">
          <p className="text-[12.5px] font-medium text-foreground">
            More options
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Auto-picked:{" "}
            <span className="text-foreground/80">
              {modelName ?? "Model"} · {categoryName ?? "Category"}
            </span>
          </p>
        </div>
        <ChevronDownIcon
          className="size-4 text-muted-foreground"
          style={{
            transition: "transform 200ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div className="border-t border-border/40 p-4">{children}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Submit button — single primary CTA, GPU-cheap hover
   ═══════════════════════════════════════════════════════════════ */

function SubmitButton({
  submitting,
  disabled,
}: {
  submitting: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={submitting || disabled}
      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary text-[14px] font-semibold text-primary-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        transition: "transform 200ms, box-shadow 200ms",
      }}
    >
      {submitting ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          Submitting…
        </>
      ) : (
        <>
          Submit prompt
          <ArrowRightIcon
            className="size-4"
            style={{
              transition: "transform 200ms",
            }}
          />
        </>
      )}
    </button>
  );
}
