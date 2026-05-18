/**
 * PWA install-prompt suppression + visit counting.
 *
 * Same shape as `guest-funnel.ts`: localStorage-only, no network. Lets
 * the install banner show only on return visitors, and respects a
 * 7-day cooldown after dismissal.
 */

const VISIT_KEY = "mcp.visit_count";
const DISMISS_KEY = "mcp.install_dismissed_at";
const INSTALLED_KEY = "mcp.install_completed";

const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function bumpVisitCounter(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(VISIT_KEY);
    const current = Number.parseInt(raw ?? "0", 10);
    const next = (Number.isFinite(current) ? current : 0) + 1;
    window.localStorage.setItem(VISIT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

export function getVisitCounter(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(VISIT_KEY);
    const n = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function isInstallSuppressed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.localStorage.getItem(INSTALLED_KEY) === "true") return true;
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number.parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    if (Date.now() - ts > DISMISS_TTL_MS) {
      window.localStorage.removeItem(DISMISS_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function recordInstallDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // swallow
  }
}

export function recordInstallCompleted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INSTALLED_KEY, "true");
  } catch {
    // swallow
  }
}

/** True when the page is already running as a PWA (standalone display). */
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari exposes a separate flag.
  return Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );
}

/** Crude iOS detection for the Share-icon hint we show when no beforeinstallprompt fires. */
export function isIosBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}
