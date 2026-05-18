/**
 * Client-safe types + pure helpers for saved searches.
 *
 * Lives outside the server services folder so client components like
 * `SavedSearchesClient` can import these without pulling Node-only
 * modules (`postgres`, `crypto`) into the browser bundle.
 */

export interface SavedSearchRow {
  id: string;
  label: string;
  query: string | null;
  type: string | null;
  sort: string | null;
  categorySlug: string | null;
  modelSlug: string | null;
  tagSlugs: string[] | null;
  lastSeenAt: Date | string;
  createdAt: Date | string;
}

/** Reconstruct the public `/search?...` URL for a saved row. */
export function buildSearchHref(row: SavedSearchRow): string {
  const sp = new URLSearchParams();
  if (row.query) sp.set("q", row.query);
  if (row.type && row.type !== "all") sp.set("type", row.type);
  if (row.sort && row.sort !== "relevance") sp.set("sort", row.sort);
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

/** Human-readable summary line — "ChatGPT prompts about cyberpunk". */
export function describeSavedSearch(row: SavedSearchRow): string {
  const parts: string[] = [];
  if (row.type === "image") parts.push("Image");
  else if (row.type === "text") parts.push("Text");
  if (row.query) parts.push(`"${row.query}"`);
  return parts.length > 0 ? parts.join(" · ") : "All new prompts";
}
