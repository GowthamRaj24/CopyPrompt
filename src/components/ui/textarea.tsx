import * as React from "react"

import { cn } from "@/lib/utils"

/** See `<Input />` for the styling rationale — same tokens, same depth treatment. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] leading-relaxed shadow-[inset_0_1px_0_0_oklch(0.25_0.05_264/0.02)] transition-colors outline-none placeholder:text-muted-foreground/60 hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:shadow-[inset_0_1px_0_0_oklch(1_0_0/0.03)] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
