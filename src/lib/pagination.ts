/**
 * Pagination helpers — keep page math consistent across services and routes.
 */

export function clampPage(page: number, maxPage: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), maxPage);
}

export function pageOffset(page: number, pageSize: number): number {
  return (clampPage(page, Number.MAX_SAFE_INTEGER) - 1) * pageSize;
}

/** Fetch `pageSize + 1` rows, then slice — avoids COUNT(*) on deep pages. */
export function slicePage<T>(
  rows: T[],
  pageSize: number,
): {
  items: T[];
  hasMore: boolean;
} {
  const hasMore = rows.length > pageSize;
  return { items: hasMore ? rows.slice(0, pageSize) : rows, hasMore };
}

export type PaginationItem = number | "ellipsis";

/** Page numbers to render, with ellipses when the range is large. */
export function getPaginationRange(
  current: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 0) return [];
  if (totalPages === 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PaginationItem[] = [1];

  let start = Math.max(2, current - 1);
  let end = Math.min(totalPages - 1, current + 1);

  if (current <= 4) {
    start = 2;
    end = 5;
  } else if (current >= totalPages - 3) {
    start = totalPages - 4;
    end = totalPages - 1;
  }

  if (start > 2) pages.push("ellipsis");

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}

export function totalPagesFromCount(
  total: number | null,
  pageSize: number,
  currentPage: number,
  hasMore: boolean,
): number {
  if (total != null && total > 0) {
    return Math.max(1, Math.ceil(total / pageSize));
  }
  if (hasMore) return currentPage + 1;
  return Math.max(1, currentPage);
}
