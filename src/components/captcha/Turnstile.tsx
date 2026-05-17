"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

/**
 * Cloudflare Turnstile widget — invisible CAPTCHA.
 *
 * Usage
 * ─────
 *   const [token, setToken] = useState<string | null>(null);
 *   …
 *   <Turnstile onVerify={setToken} />
 *   …
 *   await fetch("/api/auth/signup", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ …, captchaToken: token }),
 *   });
 *
 * Behavior
 * ────────
 *   - If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset, the widget renders
 *     nothing and immediately resolves `onVerify(null)`. The server-side
 *     verifier short-circuits to ok=true in that case, so dev workflows
 *     continue without configuration.
 *   - In production with the key set, the widget renders an invisible
 *     challenge that completes within ~200ms for typical users. Bots get
 *     a real challenge or fail outright.
 *   - The script is loaded lazily (Next.js `strategy="lazyOnload"`) so it
 *     never blocks first paint on signup / submit.
 */

interface TurnstileProps {
  /** Called with the token on success, or `null` on expiry/error/reset. */
  onVerify: (token: string | null) => void;
  /** Optional custom action label (max 32 chars), helps in CF dashboard analytics. */
  action?: string;
  /** Light or dark theme override; defaults to "auto" (follows site theme). */
  theme?: "light" | "dark" | "auto";
}

interface TurnstileGlobal {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      action?: string;
      theme?: string;
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function Turnstile({ onVerify, action, theme = "auto" }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const id = useId();

  // Latest onVerify, so the effect below can stay dependency-free
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    if (!SITE_KEY) {
      // No site key in env — treat as captcha-disabled mode
      onVerifyRef.current(null);
      return;
    }

    function tryRender() {
      const ts = window.turnstile;
      const el = containerRef.current;
      if (!ts || !el || widgetIdRef.current) return false;
      widgetIdRef.current = ts.render(el, {
        sitekey: SITE_KEY!,
        action,
        theme,
        callback: (token: string) => {
          onVerifyRef.current(token);
        },
        "error-callback": () => onVerifyRef.current(null),
        "expired-callback": () => onVerifyRef.current(null),
      });
      return true;
    }

    if (!tryRender()) {
      const interval = setInterval(() => {
        if (tryRender()) clearInterval(interval);
      }, 100);
      const timeout = setTimeout(() => clearInterval(interval), 8_000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    return () => {
      const ts = window.turnstile;
      if (ts && widgetIdRef.current) {
        try {
          ts.remove(widgetIdRef.current);
        } catch {
          // Widget already removed by the script reloading — safe to ignore.
        }
        widgetIdRef.current = null;
      }
    };
  }, [action, theme]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        async
        defer
      />
      <div
        ref={containerRef}
        id={`turnstile-${id}`}
        className="cf-turnstile mt-2 min-h-[1px]"
      />
    </>
  );
}

/** True iff the site key is configured (i.e. captcha is "live"). */
export function isTurnstileEnabled(): boolean {
  return Boolean(SITE_KEY);
}
