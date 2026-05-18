/**
 * Creator handle helpers.
 *
 * Handles power `/u/<handle>` URLs, attribution lines, and (later)
 * mention syntax. Rules are kept deliberately tight to avoid the social
 * platform "namespace squat" failure mode:
 *
 *   - 3–32 chars
 *   - lowercase a-z, 0-9, dash, underscore
 *   - must start with a letter or digit
 *   - case-insensitive uniqueness (we always store + lookup lower-cased)
 */

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 32;

const VALID = /^[a-z0-9][a-z0-9_-]{2,31}$/;

export function isValidHandle(raw: string): boolean {
  if (!raw) return false;
  if (raw.length < HANDLE_MIN || raw.length > HANDLE_MAX) return false;
  return VALID.test(raw.toLowerCase());
}

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Lossy slugify for "import a name into a handle suggestion" flows.
 * Strips emojis/spaces, lower-cases, trims to MAX. Returns "" when the
 * input has nothing usable so callers can fall back to a default seed.
 */
export function slugifyHandleSuggestion(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, HANDLE_MAX);
}
