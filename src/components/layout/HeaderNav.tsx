"use client";

import {
  FileTextIcon,
  ImageIcon,
  LayoutGridIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Center pill nav in the header.
 *
 * Three "browse" entries share one set of pill styles; the fourth —
 * "Generate" — is intentionally upgraded with a gradient background +
 * sparkle accent + "New" pill so it reads as the headline feature
 * regardless of which browse filter is currently active.
 */

type BrowseLink = {
  href: string;
  label: string;
  type: null | "image" | "text";
  icon: typeof LayoutGridIcon;
};

const BROWSE_LINKS: ReadonlyArray<BrowseLink> = [
  { href: "/search", label: "Browse", type: null, icon: LayoutGridIcon },
  {
    href: "/search?type=image",
    label: "Image",
    type: "image",
    icon: ImageIcon,
  },
  {
    href: "/search?type=text",
    label: "Text",
    type: "text",
    icon: FileTextIcon,
  },
];

export function HeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const onSearch =
    pathname === "/search" || pathname.startsWith("/search/");
  const onGenerate =
    pathname === "/generate" || pathname.startsWith("/generate/");

  return (
    <nav
      aria-label="Primary"
      className="inline-flex items-center gap-1 rounded-xl border border-border/50 bg-muted/25 p-1 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.04)] backdrop-blur-sm dark:bg-muted/15"
    >
      {/* Browse pills */}
      {BROWSE_LINKS.map(({ href, label, type: linkType, icon: Icon }) => {
        const active =
          onSearch &&
          (linkType === null
            ? !type || type === "all"
            : type === linkType);

        return (
          <Link
            key={href}
            href={href}
            className={`press inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              active
                ? "bg-background text-foreground shadow-soft ring-1 ring-border/60"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={`size-3.5 shrink-0 ${
                active ? "text-primary" : "opacity-70"
              }`}
              strokeWidth={active ? 2.2 : 1.8}
            />
            {label}
          </Link>
        );
      })}

      {/* Divider between browse and Generate so the upgraded pill reads
          as a different kind of action, not "another browse filter". */}
      <span
        aria-hidden
        className="mx-0.5 hidden h-5 w-px bg-border/40 sm:inline-block"
      />

      {/* Generate — the headline feature. Gradient background, sparkle
          icon, "New" badge. Stays visually prominent whether or not
          the user is on the Generate page. */}
      <Link
        href="/generate"
        aria-current={onGenerate ? "page" : undefined}
        className={`group/gen relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border px-3 py-1.5 text-[13px] font-semibold tracking-[-0.005em] transition-all duration-200 ${
          onGenerate
            ? "border-primary/60 bg-gradient-to-r from-primary/25 via-primary/15 to-[#3B82F6]/20 text-foreground shadow-[0_0_0_1px_oklch(0.66_0.21_270/0.4),0_4px_16px_-6px_oklch(0.66_0.21_270/0.45)] ring-1 ring-primary/30"
            : "border-primary/30 bg-gradient-to-r from-primary/12 via-primary/[0.06] to-[#3B82F6]/10 text-foreground hover:border-primary/50 hover:from-primary/20 hover:to-[#3B82F6]/15 hover:shadow-[0_4px_14px_-4px_oklch(0.66_0.21_270/0.35)]"
        }`}
      >
        <SparklesIcon
          className={`size-3.5 shrink-0 transition-transform duration-300 ${
            onGenerate
              ? "text-primary"
              : "text-primary/85 group-hover/gen:scale-110 group-hover/gen:rotate-12"
          }`}
          strokeWidth={2.2}
        />
        Generate
        <span
          aria-hidden
          className={`ml-0.5 inline-flex items-center rounded-full border border-primary/40 bg-primary/20 px-1.5 py-px text-[8.5px] font-bold uppercase leading-none tracking-wider text-primary ${
            onGenerate ? "" : "shadow-[0_0_8px_0_oklch(0.66_0.21_270/0.4)]"
          }`}
        >
          New
        </span>
      </Link>
    </nav>
  );
}
