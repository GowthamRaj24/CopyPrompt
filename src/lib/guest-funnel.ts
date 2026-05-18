/**
 * Guest signup-nudge funnel.
Als *
 * Tracks how engaged an unauthenticated visitor is — incremented from
 * every copy click and every favorite attempt. When the visitor crosses
 * a friendly threshold (2nd copy OR 1st favorite click) we dispatch a
 * `mcp:show-soft-signup` window event so the global `<SoftSignupModal />`
 * (mounted in the root layout) opens at peak intent.
 *
 * Design notes
 * ────────────
 *   - 100% localStorage-driven. Zero server traffic, zero new endpoints.
 *   - Auth-aware: signed-in callers short-circuit before any counters
 *     move. The cached check is also a single `supabase.auth.getUser()`
 *     per tab thanks to the auth helper.
 *   - Dismissal is sticky: 7-day suppression flag prevents the modal
 *     from reappearing on the next session.
 *   - Hard-cap of 5 prompts triggers re-nudging — power browsers see
 *     it again once they're clearly invested.
 */

import { isClientAuthSignedIn } from "@/lib/client-auth";

const COPY_KEY = "mcp.guest_copies";
const FAV_KEY = "mcp.guest_favs_attempt";
const DISMISS_KEY = "mcp.guest_softsignup_dismissed_at";

const COPY_THRESHOLD = 2;
const FAV_THRESHOLD = 1;
const RENUDGE_AFTER_COPIES = 8;

const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const SOFT_SIGNUP_EVENT = "mcp:show-soft-signup";

/**
 * Payload broadcast on the window so the modal can render different copy
 * depending on what the user was trying to do.
 */
export interface SoftSignupEventDetail {
  trigger: "copy" | "favorite-attempt";
  /** Slug of the prompt that triggered this nudge, if known. */
  promptSlug?: string;
}

function safeReadInt(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(key);
    const n = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function safeWriteInt(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage quota / privacy mode — silently skip.
  }
}

function dispatch(detail: SoftSignupEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SOFT_SIGNUP_EVENT, { detail }));
}

/**
 * True when the user dismissed the modal within the last 7 days
 * AND has not racked up another full window of copies since.
 */
export function isSoftSignupSuppressed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number.parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    const expired = Date.now() - ts > DISMISS_TTL_MS;
    if (expired) {
      window.localStorage.removeItem(DISMISS_KEY);
      return false;
    }
    // Power-user re-nudge: if they've kept copying past the renudge mark
    // since the dismissal, allow another modal even before TTL expires.
    const copiesSinceDismiss = safeReadInt(COPY_KEY);
    return copiesSinceDismiss < RENUDGE_AFTER_COPIES;
  } catch {
    return false;
  }
}

/**
 * Persist a dismissal — modal hides for ~7 days unless heavy usage
 * crosses the RENUDGE_AFTER_COPIES bar.
 */
export function dismissSoftSignup(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    // Reset the per-window copy counter so re-nudge math starts fresh.
    window.localStorage.setItem(COPY_KEY, "0");
  } catch {
    // Silent — nothing we can do if storage is locked.
  }
}

/**
 * Record a guest copy event. Triggers the modal on the 2nd copy
 * (or whenever the rolling counter crosses the renudge bar).
 */
export async function notifyGuestCopy(opts?: {
  promptSlug?: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (await isClientAuthSignedIn()) return;

  const next = safeReadInt(COPY_KEY) + 1;
  safeWriteInt(COPY_KEY, next);

  if (isSoftSignupSuppressed()) return;
  if (next < COPY_THRESHOLD) return;

  dispatch({ trigger: "copy", promptSlug: opts?.promptSlug });
}

/**
 * Record a guest heart click. Triggers the modal immediately because
 * a single favorite attempt is already a strong intent signal.
 */
export async function notifyGuestFavoriteAttempt(opts?: {
  promptSlug?: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (await isClientAuthSignedIn()) return;

  const next = safeReadInt(FAV_KEY) + 1;
  safeWriteInt(FAV_KEY, next);

  if (isSoftSignupSuppressed()) return;
  if (next < FAV_THRESHOLD) return;

  dispatch({ trigger: "favorite-attempt", promptSlug: opts?.promptSlug });
}
