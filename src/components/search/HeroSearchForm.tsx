import { ArrowRightIcon, SearchIcon } from "lucide-react";

/**
 * Server-rendered hero search — works without JavaScript (better LCP/TBT).
 * Submits to /search?q=… via native form GET.
 */
export function HeroSearchForm({
  placeholder = "Search prompts…",
}: {
  placeholder?: string;
}) {
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
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search prompts"
          className="h-full w-full appearance-none border-0 bg-transparent pr-14 pl-11 text-[15px] font-medium tracking-[-0.01em] outline-none ring-0 placeholder:font-normal placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 md:pr-16 md:pl-[52px] md:text-base"
        />
        <button
          type="submit"
          aria-label="Search"
          className="magnetic absolute right-2 grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15)] transition-all hover:bg-primary/90 md:size-10"
        >
          <ArrowRightIcon className="size-4 md:size-[17px]" strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
