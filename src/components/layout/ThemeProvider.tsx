"use client";

/**
 * ThemeProvider - wraps the app with next-themes.
 *
 * Reads/writes a `class="dark"` (or "light") on <html> based on user preference,
 * which Tailwind's @custom-variant dark picks up automatically.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider(
  props: React.ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />;
}
