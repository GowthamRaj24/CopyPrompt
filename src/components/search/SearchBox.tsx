"use client";

import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

interface SearchBoxProps {
  autoFocus?: boolean;
  placeholder?: string;
  defaultValue?: string;
  size?: "hero" | "lg" | "md";
}

/**
 * Premium search box. Submits → /search?q=...
 *
 * Sizes:
 *   - hero: 56-60px tall, indigo focus glow, submit button on right
 *   - lg:   48-52px tall, secondary placements
 *   - md:   40px, compact in nav/sidebar
 *
 * Single focus indicator: border becomes primary + soft halo shadow.
 * No double-ring artifacts from global :focus-visible (inputs are opted out
 * in globals.css).
 */
export function SearchBox({
  autoFocus,
  placeholder,
  defaultValue,
  size = "lg",
}: SearchBoxProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue ?? "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => {
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    }, 280);
    return () => clearTimeout(t);
  }, [autoFocus]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const isHero = size === "hero";

  const heightClass = isHero
    ? "h-13 sm:h-14 md:h-[60px]"
    : size === "lg"
      ? "h-12 md:h-13"
      : "h-10";

  const inputTextClass = isHero
    ? "text-[15px] md:text-base"
    : size === "lg"
      ? "text-[14px] md:text-[15px]"
      : "text-[13px]";

  const iconSize = isHero ? "size-[17px]" : "size-4";

  const formClassName = `group relative z-[1] flex w-full items-center overflow-hidden rounded-xl border bg-card/60 backdrop-blur-md transition-[border-color,box-shadow] duration-300 ease-out ${heightClass} ${
    isHero
      ? focused
        ? "border-primary/70 shadow-[0_0_0_1px_oklch(0.66_0.21_270/0.5),0_0_32px_-6px_oklch(0.66_0.21_270/0.45),0_0_64px_-12px_oklch(0.55_0.22_262/0.35),inset_0_1px_0_0_oklch(1_0_0/0.06)]"
        : "border-primary/35 shadow-[0_0_0_1px_oklch(0.54_0.225_270/0.2),0_0_28px_-8px_oklch(0.54_0.225_270/0.28),0_0_48px_-16px_oklch(0.55_0.22_262/0.18)] hover:border-primary/50"
      : focused
        ? "border-primary/60 shadow-[0_0_0_3px_oklch(0.66_0.21_270_/_0.12)]"
        : "border-border/60 hover:border-border"
  }`;

  const form = (
    <form onSubmit={handleSubmit} className={formClassName}>
      {/* Leading search icon */}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-4 transition-colors duration-150 ${
          focused ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <SearchIcon className={iconSize} strokeWidth={1.8} />
      </span>

      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? "Search prompts…"}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search prompts"
        className={`h-full w-full appearance-none border-0 bg-transparent font-medium tracking-[-0.01em] outline-none ring-0 placeholder:font-normal placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 ${
          isHero
            ? "pr-14 pl-11 md:pr-16 md:pl-[52px]"
            : "pr-3 pl-11"
        } ${inputTextClass}`}
      />

      {/* Trailing submit button — hero only */}
      {isHero && (
        <button
          type="submit"
          aria-label="Search"
          disabled={!query.trim()}
          className={`magnetic absolute right-2 grid place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15),inset_0_1px_0_0_oklch(1_0_0/0.1)] transition-all duration-150 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none ${
            isHero ? "size-9 md:size-10" : "size-8"
          }`}
        >
          <ArrowRightIcon
            className={isHero ? "size-4 md:size-[17px]" : "size-4"}
            strokeWidth={2.2}
          />
        </button>
      )}

      {/* Trailing kbd hint — non-hero, when empty */}
      {!isHero && query.length === 0 && (
        <kbd className="kbd absolute right-3 hidden sm:inline-flex">
          ⌘K
        </kbd>
      )}

      {/* Trailing kbd hint — non-hero, when typing */}
      {!isHero && query.length > 0 && (
        <kbd className="kbd absolute right-3 hidden sm:inline-flex">
          ↵
        </kbd>
      )}
    </form>
  );

  if (!isHero) return form;

  return (
    <div className="search-hero-glow-wrap relative w-full">
      {/* Ambient glow behind the bar */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 via-[#3B82F6]/30 to-[#8B5CF6]/40 opacity-70 blur-2xl transition-[opacity,transform] duration-300 sm:-inset-1.5 sm:blur-3xl ${
          focused ? "opacity-100 scale-[1.02]" : "scale-100"
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-xl ring-1 ring-primary/25 transition-opacity duration-300 ${
          focused ? "opacity-100 ring-primary/45" : "opacity-60"
        }`}
      />
      {form}
    </div>
  );
}
