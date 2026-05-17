import Link from "next/link";
import {
  getPaginationRange,
  totalPagesFromCount,
} from "@/lib/pagination";

interface SearchPaginationProps {
  page: number;
  total: number;
  pageSize: number;
  hasMore: boolean;
  buildHref: (page: number) => string;
}

export function SearchPagination({
  page,
  total,
  pageSize,
  hasMore,
  buildHref,
}: SearchPaginationProps) {
  const totalPages = totalPagesFromCount(
    total,
    pageSize,
    page,
    hasMore,
  );
  if (totalPages <= 1 && page <= 1 && !hasMore) return null;

  const pages = getPaginationRange(page, totalPages);

  return (
    <nav
      aria-label="Search results pages"
      className="mt-10 flex flex-col gap-4 border-t border-border/40 pt-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <PageNavLink
        active={page > 1}
        href={buildHref(page - 1)}
        label="← Previous"
      />

      <ol className="flex flex-wrap items-center justify-center gap-1">
        {pages.map((item, idx) =>
          item === "ellipsis" ? (
            <li
              key={`ellipsis-${idx}`}
              className="px-1 font-mono text-[11px] text-muted-foreground/50"
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span
                  aria-current="page"
                  className="grid size-8 place-items-center rounded-md bg-muted font-mono text-[11px] font-medium text-foreground"
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={buildHref(item)}
                  className="grid size-8 place-items-center rounded-md font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>

      <PageNavLink
        active={hasMore}
        href={buildHref(page + 1)}
        label="Next →"
      />
    </nav>
  );
}

function PageNavLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  if (!active) {
    return (
      <span className="text-center text-[12px] text-muted-foreground/30 sm:text-left">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="link-underline text-center text-[12px] font-medium text-foreground sm:text-left"
    >
      {label}
    </Link>
  );
}
