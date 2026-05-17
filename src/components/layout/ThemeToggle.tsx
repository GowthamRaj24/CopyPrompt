"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Theme toggle — binary sun/moon switch.
 *
 * Design rationale
 * ────────────────
 *   - Single button, single click → flips between light and dark.
 *     "System" mode is preserved by next-themes if the user has
 *     never clicked the toggle; once they click, we lock to their
 *     explicit preference (which is what 95% of users actually want).
 *   - The visible icon shows what you'll GET on click, not what's
 *     currently active. Light theme on screen → moon icon (means
 *     "switch to dark"). Universal convention.
 *   - Icons cross-fade with a 300ms rotate + scale so the swap feels
 *     tactile and confirms the click without being loud.
 *
 * Hydration safety
 * ────────────────
 * `resolvedTheme` is unknown on the server (we can't read the user's
 * `prefers-color-scheme` media query at SSR time without UA hints).
 * Returning a same-size placeholder during the first paint keeps the
 * header layout stable; the real icon swaps in on mount.
 */
interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR placeholder — exact same dimensions as the live button so the
  // header doesn't shift when JS hydrates.
  if (!mounted) {
    return (
      <div
        aria-hidden
        className={`size-8 ${className ?? ""}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const nextLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={nextLabel}
      title={nextLabel}
      className={`press relative grid size-8 place-items-center overflow-hidden rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className ?? ""}`}
    >
      {/* Sun — visible when current theme is dark */}
      <SunIcon
        className={`absolute size-[15px] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-50 opacity-0"
        }`}
        strokeWidth={1.8}
        aria-hidden
      />
      {/* Moon — visible when current theme is light */}
      <MoonIcon
        className={`absolute size-[15px] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isDark
            ? "rotate-90 scale-50 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
        strokeWidth={1.8}
        aria-hidden
      />
    </button>
  );
}
