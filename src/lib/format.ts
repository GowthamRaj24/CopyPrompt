/**
 * Compact, human-friendly formatters used across the app.
 *
 * Server-safe (no `window`, no React) so they can be imported by both
 * server components and client components without bloat.
 */

/**
 * Relative-time formatter with sensible breakpoints for our content surface.
 *
 *   < 1 minute    → "just now"
 *   < 1 hour      → "12m ago"
 *   < 1 day       → "3h ago"
 *   < 30 days     → "5d ago" or "5 days ago"
 *   < 12 months   → "3 months ago"
 *   else          → "May 11, 2026"
 *
 * `style` chooses the brevity:
 *   - "compact"   (default for cards / admin): "12m ago", "3h ago", "5d ago"
 *   - "long"      (for prose / detail pages): "12 minutes ago", "3 hours ago"
 */
export function formatRelativeTime(
  date: Date | string,
  style: "compact" | "long" = "long",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return style === "compact" ? `${diffSec}s ago` : "just now";
  }
  if (diffMin < 60) {
    return style === "compact"
      ? `${diffMin}m ago`
      : `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  }
  if (diffHour < 24) {
    return style === "compact"
      ? `${diffHour}h ago`
      : `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  }
  if (diffDay < 30) {
    if (style === "compact") return `${diffDay}d ago`;
    if (diffDay < 1) return "today";
    if (diffDay === 1) return "yesterday";
    return `${diffDay} days ago`;
  }
  if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return style === "compact"
      ? `${months}mo ago`
      : `${months} month${months === 1 ? "" : "s"} ago`;
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Compact number formatter: 1234 → 1.2k, 1234567 → 1.2M.
 * Once you cross 10k, decimals disappear (12k not 12.3k).
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
