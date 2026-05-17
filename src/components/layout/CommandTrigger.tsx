"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Cmd/Ctrl+K search trigger in the header.
 *
 * Click or keyboard shortcut opens a command-palette-style overlay
 * that focuses instantly and navigates to /search on submit.
 *
 * The overlay itself is a minimal, fast search input — not a full
 * command palette with categories. That would be over-engineering.
 * Speed is the product.
 *
 * Why we portal the overlay
 * ─────────────────────────
 * The <header> uses `sticky top-0 z-50 backdrop-blur-xl`. Sticky +
 * z-index creates a stacking context, which traps any descendant's
 * z-index inside it. That means even the overlay's z-100 only
 * applied relative to header siblings — globally the header still
 * sat on top, so the user saw the navbar visible above the overlay's
 * darkening. Portalling to <body> sidesteps the trap entirely:
 * the overlay becomes a sibling of <header>, free to sit above it.
 */
export function CommandTrigger() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Portal target only exists in the browser. Defer until mount to
  // avoid `document is undefined` during SSR.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  // Auto-focus when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Lock body scroll while open so the page behind doesn't drift
  // when the user spins the wheel inside the palette.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    close();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const overlay = (
    <div
      className="cmd-overlay fade-in-blur"
      onClick={close}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search prompts"
    >
      <div
        className="cmd-panel fade-in-blur"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 border-b border-border/60 px-4">
            <SearchIcon
              className="size-[18px] shrink-0 text-muted-foreground"
              strokeWidth={1.8}
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search prompts…"
              autoComplete="off"
              spellCheck={false}
              className="h-[52px] w-full border-0 bg-transparent text-[15px] font-medium tracking-[-0.01em] outline-none ring-0 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
            />
            <kbd className="kbd shrink-0">ESC</kbd>
          </div>
        </form>
        <div className="px-4 py-3">
          <p className="text-[11px] text-muted-foreground">
            {query.trim()
              ? "Press ↵ to search"
              : "Type to search prompts…"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger button — header inline */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press hidden h-8 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 text-[12px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground md:inline-flex"
        aria-label="Search (Cmd+K)"
      >
        <SearchIcon className="size-3.5" strokeWidth={2} />
        <span className="hidden lg:inline">Search…</span>
        <kbd className="kbd ml-1">⌘K</kbd>
      </button>

      {/* Overlay portaled to <body> so it escapes the header's
          sticky+z-50 stacking context. */}
      {open && mounted && createPortal(overlay, document.body)}
    </>
  );
}
