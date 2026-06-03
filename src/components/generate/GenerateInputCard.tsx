"use client";

import {
  ArrowRightIcon,
  Loader2Icon,
  SparklesIcon,
  WandIcon,
} from "lucide-react";
import { type KeyboardEvent, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Compact input card for the generator surface.
 *
 * Used on both the full `/generate` page and the inline generator on
 * the search results page. The parent owns the description text + the
 * `useGenerator` hook; this component is purely presentational + emits
 * `onSubmit` when the user activates the button or hits Cmd/Ctrl+Enter.
 */

interface GenerateInputCardProps {
  description: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDisabled?: boolean;
  /** Render example chips below the textarea. */
  examples?: ReadonlyArray<string>;
  /** Right-aligned helper text (e.g. quota indicator). */
  rightHint?: React.ReactNode;
  placeholder?: string;
  /** Visual variant. `compact` is for the inline card; `hero` for /generate. */
  variant?: "hero" | "compact";
}

const MAX_CHARS = 2_000;

export function GenerateInputCard({
  description,
  onChange,
  onSubmit,
  isLoading,
  isDisabled,
  examples,
  rightHint,
  placeholder = "Describe what you want help with — e.g. 'A follow-up email to a client who hasn't paid in 30 days.'",
  variant = "hero",
}: GenerateInputCardProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!isLoading && !isDisabled) onSubmit();
      }
    },
    [onSubmit, isLoading, isDisabled],
  );

  const isHero = variant === "hero";
  const tooShort = description.trim().length < 10;
  const submitDisabled = isLoading || isDisabled || tooShort;

  return (
    <div className="relative">
      {/* Ambient glow only on hero variant */}
      {isHero && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/30 via-[#3B82F6]/20 to-[#8B5CF6]/30 opacity-60 blur-2xl sm:-inset-3 sm:blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-primary/20"
          />
        </>
      )}

      <div
        className={`relative z-[1] rounded-2xl border bg-card/70 p-4 backdrop-blur-md transition-[border-color,box-shadow] duration-300 sm:p-5 ${
          isHero
            ? "border-primary/35 shadow-[0_0_0_1px_oklch(0.54_0.225_270/0.18),0_18px_42px_-22px_oklch(0.66_0.21_270/0.45)] focus-within:border-primary/65 focus-within:shadow-[0_0_0_1px_oklch(0.66_0.21_270/0.55),0_24px_48px_-20px_oklch(0.66_0.21_270/0.55)]"
            : "border-border/70 shadow-soft focus-within:border-primary/40"
        }`}
      >
        <div className="flex items-center gap-2 pb-2.5">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-md ${
              isHero
                ? "border border-primary/35 bg-primary/15 text-primary"
                : "bg-primary/10 text-primary"
            }`}
          >
            <WandIcon className="size-3.5" strokeWidth={2} />
          </span>
          <label
            htmlFor="gen-input"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            What do you want help with?
          </label>
          {rightHint && (
            <div className="ml-auto text-[11px] text-muted-foreground">
              {rightHint}
            </div>
          )}
        </div>

        <Textarea
          id="gen-input"
          value={description}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={isHero ? 5 : 3}
          placeholder={placeholder}
          maxLength={MAX_CHARS}
          disabled={isLoading || isDisabled}
          className={`w-full resize-y border-0 bg-transparent px-2 leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
            isHero
              ? "min-h-[140px] text-[14.5px]"
              : "min-h-[88px] text-[13.5px]"
          }`}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/30 pt-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
            {description.length} / {MAX_CHARS}
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
            <kbd className="kbd">⌘/Ctrl+↵</kbd>
          </span>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            size={isHero ? "default" : "sm"}
            className="gap-2 shadow-[0_4px_14px_-4px_oklch(0.66_0.21_270/0.5)] hover:shadow-[0_6px_18px_-4px_oklch(0.66_0.21_270/0.65)]"
          >
            {isLoading ? (
              <>
                <Loader2Icon
                  className={`animate-spin ${isHero ? "size-4" : "size-3.5"}`}
                />
                Generating…
              </>
            ) : (
              <>
                <SparklesIcon
                  className={isHero ? "size-4" : "size-3.5"}
                  strokeWidth={2.2}
                />
                Generate prompt
                <ArrowRightIcon
                  className={`${isHero ? "size-3.5" : "size-3"} opacity-80`}
                  strokeWidth={2.4}
                />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Examples */}
      {examples && examples.length > 0 && !isLoading && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/70">
            Try
          </span>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onChange(ex)}
              disabled={isLoading || isDisabled}
              className="press inline-flex max-w-full items-center truncate rounded-full border border-border/50 bg-card/50 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
