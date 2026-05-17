import { randomBytes } from "node:crypto";
import { SITE_BRAND } from "@/lib/site-brand";

/** Cryptographically random unguessable share token (~43 chars base64url). */
export function generateShareToken(): string {
  return randomBytes(32)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 43);
}

export function buildShareUrl(shareToken: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    `https://${SITE_BRAND.domain}`;
  return `${base}/s/${shareToken}`;
}
