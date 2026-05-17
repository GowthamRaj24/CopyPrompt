import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Default styling baseline
 * ────────────────────────
 * - `border-border` instead of `border-input` → visibly contrasts with
 *   both page bg and card surfaces in light + dark mode.
 * - `bg-background` instead of `bg-transparent` → the field is always
 *   its own surface, even when sitting on translucent / blurred
 *   atmospheric backgrounds (homepage, /submit, /account).
 * - `shadow-[inset_0_1px_0_…]` → tiny inner highlight on the top edge
 *   gives the field a subtle "etched" depth, the same trick Linear,
 *   Vercel and Stripe use to make inputs feel tactile.
 *
 * Hover and focus are tuned to be felt, not seen: borders darken
 *   slightly on hover, then snap to `--ring` on focus.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-1 text-[14px] shadow-[inset_0_1px_0_0_oklch(0.25_0.05_264/0.02)] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:shadow-[inset_0_1px_0_0_oklch(1_0_0/0.03)] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
