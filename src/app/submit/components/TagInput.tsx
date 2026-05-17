"use client";

import { PlusIcon, XIcon } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { slugifyTag } from "@/server/validators/submission.validator";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Existing tag slugs from DB - used for autocomplete + popular pill suggestions */
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
  /** Optional curated set shown as click-to-add pills under the input */
  popularSuggestions?: string[];
}

/**
 * Multi-select chip input with autocomplete and click-to-add suggestions.
 *
 * Behavior:
 *   - Type a word + Enter (or comma) → adds as a chip
 *   - As you type, matching suggestions appear → click to add
 *   - Click a popular suggestion pill → adds it instantly (no typing required)
 *   - Click X on chip → removes
 *   - Backspace on empty input → removes last chip
 *   - All input is auto-slugified (lowercase, hyphens, no special chars)
 *   - Duplicates ignored
 *   - Max chips limit enforced
 */
export function TagInput({
  value,
  onChange,
  suggestions = [],
  maxTags = 5,
  placeholder = "Type and press Enter to add…",
  popularSuggestions,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const filteredSuggestions = useMemo(() => {
    const slugified = slugifyTag(input);
    if (!slugified) return [];
    return suggestions
      .filter((s) => s.includes(slugified) && !value.includes(s))
      .slice(0, 8);
  }, [input, suggestions, value]);

  // Show a curated subset of popular tags that haven't been added yet
  const popularPills = useMemo(() => {
    const source = popularSuggestions ?? suggestions;
    return source.filter((s) => !value.includes(s)).slice(0, 10);
  }, [popularSuggestions, suggestions, value]);

  function addTag(rawTag: string) {
    const slug = slugifyTag(rawTag);
    if (!slug) return;
    if (value.includes(slug)) {
      setInput("");
      return;
    }
    if (value.length >= maxTags) return;
    onChange([...value, slug]);
    setInput("");
    setShowSuggestions(false);
  }

  function removeTag(slug: string) {
    onChange(value.filter((t) => t !== slug));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim().length > 0) addTag(input);
    } else if (e.key === "Backspace" && input.length === 0 && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isFull = value.length >= maxTags;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Chip + input row ─────────────────────────────── */}
      {/* Same border + inner-highlight treatment as <Input /> for
          a unified form surface. `min-h-9` matches Input's height
          so an empty TagInput aligns with siblings. */}
      <div
        className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 text-sm shadow-[inset_0_1px_0_0_oklch(0.25_0.05_264/0.02)] transition-colors hover:border-foreground/20 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 dark:shadow-[inset_0_1px_0_0_oklch(1_0_0/0.03)]"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="chip-pop inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={`Remove ${tag}`}
              className="grid size-4 place-items-center rounded-sm hover:bg-primary/20"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        {!isFull && (
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 border-0 bg-transparent p-1 text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Add tag"
          />
        )}
      </div>

      {/* ── Counter line ─────────────────────────────────── */}
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {isFull ? (
            <span className="text-foreground">
              Max {maxTags} tags reached
            </span>
          ) : (
            <>
              {value.length}/{maxTags} · Press{" "}
              <kbd className="kbd !h-4 !text-[9px]">Enter</kbd> to add
            </>
          )}
        </span>
      </div>

      {/* ── Popular pills (click to add) ─────────────────── */}
      {!isFull && popularPills.length > 0 && (
        <div className="mt-2.5">
          <p className="mb-1.5 text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">
            Popular tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {popularPills.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="press inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                <PlusIcon className="size-2.5" strokeWidth={2.5} />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Live autocomplete dropdown ───────────────────── */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-popover py-1 shadow-pop">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <span className="font-medium">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
