"use client";

import {
  FileTextIcon,
  ImageIcon,
  LayoutGridIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  { href: "/search", label: "Browse", type: null, icon: LayoutGridIcon },
  { href: "/search?type=image", label: "Image", type: "image", icon: ImageIcon },
  { href: "/search?type=text", label: "Text", type: "text", icon: FileTextIcon },
  { href: "/generate", label: "Generate", type: "generate", icon: SparklesIcon },
] as const;

/**
 * Center pill nav — highlights the active browse filter.
 */
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
      className="inline-flex items-center gap-0.5 rounded-xl border border-border/50 bg-muted/25 p-1 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.04)] backdrop-blur-sm dark:bg-muted/15"
    >
      {LINKS.map(({ href, label, type: linkType, icon: Icon }) => {
        const active =
          linkType === "generate"
            ? onGenerate
            : onSearch &&
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
              className={`size-3.5 shrink-0 ${active ? "text-primary" : "opacity-70"}`}
              strokeWidth={active ? 2.2 : 1.8}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
