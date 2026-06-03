"use client";

import { ArrowRightIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

/**
 * Hero search bar on the homepage.
 *
 * Why client-side
 * ───────────────
 * Before: server-rendered native `<form action="/search">`. Submission
 * triggered a hard navigation with no visible feedback, so on slow
 * connections the user saw the hero "freeze" between Enter and the
 * search page mounting. Now we intercept the submit, route via the
 * Next.js client router inside `startTransition`, and show a spinner
 * for the entire pending window — covering DB queries + render +
 * hydration of the destination page.
 *
 * Accessibility
 * ─────────────
 *   - `aria-busy` flips on the form while routing so screen readers
 *     announce the pending state.
 *   - The submit button gets `aria-label` "Searching…" during pending.
 *   - The icon swap (arrow → spinner) gives sighted users immediate
 *     visual feedback.
 */
export function HeroSearchForm({
  placeholder = "Search prompts…",
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isPending) return;
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <div className="search-hero-glow-wrap relative w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 via-[#3B82F6]/30 to-[#8B5CF6]/40 opacity-70 blur-2xl sm:-inset-1.5 sm:blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl opacity-60 ring-1 ring-primary/25"
      />
      <form
        action="/search"
        method="get"
        onSubmit={handleSubmit}
        aria-busy={isPending}
        className="group relative z-[1] flex h-13 w-full items-center overflow-hidden rounded-xl border border-primary/35 bg-card/60 shadow-[0_0_0_1px_oklch(0.54_0.225_270/0.2),0_0_28px_-8px_oklch(0.54_0.225_270/0.28)] backdrop-blur-md transition-[border-color,box-shadow] duration-300 sm:h-14 md:h-[60px] hover:border-primary/50 focus-within:border-primary/70 focus-within:shadow-[0_0_0_1px_oklch(0.66_0.21_270/0.5),0_0_32px_-6px_oklch(0.66_0.21_270/0.45)]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 text-muted-foreground"
        >
          <SearchIcon className="size-[17px]" strokeWidth={1.8} />
        </span>
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search prompts"
          disabled={isPending}
          className="h-full w-full appearance-none border-0 bg-transparent pr-14 pl-11 text-[15px] font-medium tracking-[-0.01em] outline-none ring-0 placeholder:font-normal placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 disabled:cursor-wait disabled:opacity-70 md:pr-16 md:pl-[52px] md:text-base"
        />
        <button
          type="submit"
          aria-label={isPending ? "Searching" : "Search"}
          disabled={isPending || !query.trim()}
          className="magnetic absolute right-2 grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15)] transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 md:size-10"
        >
          {isPending ? (
            <Loader2Icon
              className="size-4 animate-spin md:size-[17px]"
              strokeWidth={2.2}
            />
          ) : (
            <ArrowRightIcon
              className="size-4 md:size-[17px]"
              strokeWidth={2.2}
            />
          )}
        </button>

        {/* Slim top progress bar — slides while the route is pending */}
        {isPending && (
          <span
            aria-hidden
            className="search-progress-bar pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden"
          >
            <span className="search-progress-bar-thumb block h-full bg-gradient-to-r from-transparent via-primary to-transparent" />
          </span>
        )}
      </form>
    </div>
  );
}
