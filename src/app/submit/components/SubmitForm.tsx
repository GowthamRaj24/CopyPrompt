"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightIcon,
  ImageIcon,
  Loader2Icon,
  MessageSquareIcon,
  PlusIcon,
  RocketIcon,
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
import { Textarea } from "@/components/ui/textarea";
import {
  type SubmissionInput,
  submissionSchema,
} from "@/server/validators/submission.validator";
import { ModelPicker } from "./ModelPicker";
import { StudioPanel } from "./StudioPanel";
import { TagInput } from "./TagInput";
import { VisibilityChoice } from "./VisibilityChoice";

interface SubmitFormProps {
  models: Array<{ slug: string; name: string; type: "image" | "text" }>;
  categories: Array<{ slug: string; name: string }>;
  tagSuggestions: string[];
}

export function SubmitForm({
  models,
  categories,
  tagSuggestions,
}: SubmitFormProps) {
  const router = useRouter();
  const [type, setType] = useState<"image" | "text">("image");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = isTurnstileEnabled();

  const defaultCategory = useMemo(() => {
    const universal = categories.find((c) =>
      ["other", "general", "misc"].includes(c.slug),
    );
    return (universal ?? categories[0])?.slug ?? "";
  }, [categories]);

  const modelsForType = useMemo(
    () => models.filter((m) => m.type === type),
    [models, type],
  );

  type SubmissionFormValues = z.input<typeof submissionSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SubmissionFormValues, unknown, SubmissionInput>({
    resolver: zodResolver(submissionSchema) as unknown as Resolver<
      SubmissionFormValues,
      unknown,
      SubmissionInput
    >,
    defaultValues: {
      type: "image",
      title: "",
      promptText: "",
      modelSlug: "",
      categorySlug: defaultCategory,
      tags: [],
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const titleValue = watch("title") ?? "";
  const promptValue = watch("promptText") ?? "";
  const tags = watch("tags") ?? [];
  const modelSlug = watch("modelSlug") ?? "";
  const categorySlug = watch("categorySlug");
  const expectedOutcomeValue =
    (watch("expectedOutcome" as never) as unknown as string | undefined) ?? "";

  function handleTypeChange(newType: "image" | "text") {
    setType(newType);
    setValue("type", newType);
    setValue("modelSlug", "", { shouldValidate: false });
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
      const isPrivate = visibility === "private";
      const res = await fetch(
        isPrivate ? "/api/prompts/private" : "/api/submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, captchaToken }),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        toast.error(
          isPrivate ? "Could not create private prompt" : "Submission failed",
          {
            description:
              errBody.error ?? "Please check your inputs and try again.",
          },
        );
        setSubmitting(false);
        return;
      }

      const body = await res.json();
      reset();
      if (isPrivate && body.shareUrl) {
        const q = new URLSearchParams({
          url: body.shareUrl,
          title: body.title ?? data.title,
        });
        router.push(`/submit/shared?${q.toString()}`);
      } else {
        router.push(`/submit/thank-you?id=${body.id}`);
      }
    } catch {
      toast.error("Network error", {
        description: "Couldn't reach the server. Please retry.",
      });
      setSubmitting(false);
    }
  }

  const submitLabel =
    visibility === "private" ? "Create share link" : "Submit for review";

  return (
    <>
      <form
        id="submit-prompt-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-8 pb-28 lg:pb-8"
      >
        <StudioPanel
          id="step-distribution"
          step="01"
          title="Distribution"
          subtitle="Choose how the world — or just your clients — will see this prompt."
        >
          <FormatPicker type={type} onChange={handleTypeChange} />
          <VisibilityChoice value={visibility} onChange={setVisibility} />
        </StudioPanel>

        <StudioPanel
          id="step-content"
          step="02"
          title="Content"
          subtitle="Name it and write the exact prompt people will copy."
        >
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
              className="h-12 border-border/50 bg-background/50 text-[15px] font-medium"
              placeholder={
                type === "image"
                  ? "Cinematic cyberpunk portrait"
                  : "Validate a startup idea"
              }
            />
          </Field>

          <Field
            label="Prompt body"
            required
            error={errors.promptText?.message}
            counter={`${promptValue.length}/5000`}
            counterAlert={
              promptValue.length > 0 && promptValue.length < 20
                ? "need 20+"
                : undefined
            }
          >
            <div className="submit-editor p-3 sm:p-4">
              <Textarea
                {...register("promptText")}
                maxLength={5000}
                rows={8}
                className="autosize min-h-[180px] resize-none font-mono text-[13px] leading-[1.75] text-foreground placeholder:text-muted-foreground/40"
                placeholder={
                  type === "image"
                    ? "moody neon-lit portrait, rain-slick streets, blade runner aesthetic…"
                    : "Act as an experienced startup advisor. Validate this idea…"
                }
              />
            </div>
          </Field>
        </StudioPanel>

        <StudioPanel
          id="step-proof"
          step="03"
          title="Proof"
          subtitle={
            type === "image"
              ? "Show what this prompt produces — up to 3 images."
              : "Paste a real sample output. This is what sells the prompt."
          }
        >
          {type === "image" ? (
            <Field
              label="Gallery"
              required
              error={
                (errors as { imageUrls?: { message?: string } }).imageUrls
                  ?.message
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
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <PlusIcon className="size-4" />
                    Add image slot
                  </button>
                )}
              </div>
            </Field>
          ) : (
            <Field
              label="Sample output"
              required
              error={
                (errors as { expectedOutcome?: { message?: string } })
                  .expectedOutcome?.message
              }
              counter={`${expectedOutcomeValue.length}/5000`}
              counterAlert={
                expectedOutcomeValue.length > 0 &&
                expectedOutcomeValue.length < 20
                  ? "need 20+"
                  : undefined
              }
            >
              <div className="submit-editor p-3 sm:p-4">
                <Textarea
                  {...register("expectedOutcome" as never)}
                  maxLength={5000}
                  rows={6}
                  className="autosize min-h-[140px] resize-none text-[13px] leading-relaxed"
                  placeholder="Top 3 risks:&#10;1. Market too small…"
                />
              </div>
            </Field>
          )}
        </StudioPanel>

        <StudioPanel
          id="step-discover"
          step="04"
          title="Discover"
          subtitle="Tell us which AI tool and how people should find this."
        >
          <Field label="AI model" required>
            <ModelPicker
              models={modelsForType}
              value={modelSlug}
              onChange={(slug) =>
                setValue("modelSlug", slug, { shouldValidate: true })
              }
              error={errors.modelSlug?.message}
            />
          </Field>

          <Field label="Category" error={errors.categorySlug?.message}>
            <CategoryChips
              categories={categories}
              value={categorySlug ?? ""}
              onChange={(slug) =>
                setValue("categorySlug", slug, { shouldValidate: true })
              }
            />
          </Field>

          <Field label="Tags" hint="Up to 5 — how people search for this.">
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
                  : "advisor, validation…"
              }
            />
          </Field>
        </StudioPanel>

        <StudioPanel
          id="step-launch"
          step="05"
          title="Launch"
          subtitle={submitLabel}
          className="submit-launch-bar !border-primary/30"
        >
          {captchaRequired && (
            <div className="flex justify-center">
              <Turnstile onVerify={setCaptchaToken} action="submit-prompt" />
            </div>
          )}

          <div className="hidden lg:block">
            <LaunchButton
              submitting={submitting}
              disabled={captchaRequired && !captchaToken}
              label={submitLabel}
              visibility={visibility}
            />
          </div>
        </StudioPanel>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/20 bg-background/90 p-4 backdrop-blur-xl lg:hidden">
        <LaunchButton
          submitting={submitting}
          disabled={captchaRequired && !captchaToken}
          label={submitLabel}
          visibility={visibility}
          formId="submit-prompt-form"
        />
      </div>
    </>
  );
}

function FormatPicker({
  type,
  onChange,
}: {
  type: "image" | "text";
  onChange: (t: "image" | "text") => void;
}) {
  return (
    <div className="flex gap-2">
      <FormatOption
        active={type === "image"}
        onClick={() => onChange("image")}
        icon={<ImageIcon className="size-4" />}
        label="Image"
        desc="Midjourney, Flux, DALL·E"
      />
      <FormatOption
        active={type === "text"}
        onClick={() => onChange("text")}
        icon={<MessageSquareIcon className="size-4" />}
        label="Text"
        desc="ChatGPT, Claude, Gemini"
      />
    </div>
  );
}

function FormatOption({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all ${
        active
          ? "border-primary bg-primary/15 shadow-[0_0_20px_-6px_oklch(0.66_0.21_270_/_0.45)]"
          : "border-border/40 bg-background/30 hover:border-border"
      }`}
    >
      <span
        className={`flex items-center gap-2 text-[13px] font-semibold ${
          active ? "text-primary" : "text-foreground"
        }`}
      >
        {icon}
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{desc}</span>
    </button>
  );
}

function CategoryChips({
  categories,
  value,
  onChange,
}: {
  categories: Array<{ slug: string; name: string }>;
  value: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => onChange(c.slug)}
          className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
            value === c.slug
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/50 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

function LaunchButton({
  submitting,
  disabled,
  label,
  visibility,
  formId,
}: {
  submitting: boolean;
  disabled?: boolean;
  label: string;
  visibility: "public" | "private";
  formId?: string;
}) {
  return (
    <button
      type="submit"
      form={formId}
      disabled={submitting || disabled}
      className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-[0_8px_32px_-8px_oklch(0.66_0.21_270_/_0.55)] transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {submitting ? (
        <>
          <Loader2Icon className="size-5 animate-spin" />
          {visibility === "private" ? "Creating link…" : "Submitting…"}
        </>
      ) : (
        <>
          <RocketIcon className="size-5" />
          {label}
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

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
  counter?: string;
  counterAlert?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
          {required && <span className="ml-1 text-primary">*</span>}
        </label>
        {counter && (
          <span
            className={`font-mono text-[11px] tabular-nums ${
              counterAlert ? "text-destructive" : "text-muted-foreground/50"
            }`}
          >
            {counterAlert ? `${counterAlert} · ${counter}` : counter}
          </span>
        )}
      </div>
      <div id={id}>{children}</div>
      {error ? (
        <p className="mt-2 text-[12px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

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
    <div className="rounded-xl border border-border/40 bg-background/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Slot {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <ModeChip active={mode === "upload"} onClick={() => setMode("upload")}>
            Upload
          </ModeChip>
          <ModeChip active={mode === "url"} onClick={() => setMode("url")}>
            URL
          </ModeChip>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove slot ${index + 1}`}
              className="ml-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2Icon className="size-4" />
            </button>
          )}
        </div>
      </div>
      {mode === "upload" ? (
        <ImageUploader
          onUploaded={onChange}
          initialUrl={url || undefined}
          placeholder="Drop, click, or paste"
        />
      ) : (
        <div className="flex gap-3">
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/50 bg-muted/30">
            {hasValidUrl && thumbOk ? (
              // biome-ignore lint/performance/noImgElement: preview
              <img
                src={url}
                alt=""
                className="size-full object-cover"
                onError={() => setThumbOk(false)}
              />
            ) : (
              <span className="text-[11px] text-muted-foreground">#{index + 1}</span>
            )}
          </div>
          <Input
            type="url"
            value={url}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className="h-11 flex-1"
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
      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted/50"
      }`}
    >
      {children}
    </button>
  );
}
