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
