/**
 * Canonical app origin for OAuth redirects and share links.
 * Prefer NEXT_PUBLIC_APP_URL in production so www vs apex stays consistent.
 */
export function getPublicAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function authCallbackUrl(next?: string): string {
  const base = getPublicAppOrigin();
  const path = next
    ? `/auth/callback?next=${encodeURIComponent(next)}`
    : "/auth/callback";
  return `${base}${path}`;
}
