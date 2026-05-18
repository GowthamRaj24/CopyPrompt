"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { toast } from "sonner";
import { notifyGuestCopy } from "@/lib/guest-funnel";
import { getModelLauncher } from "@/lib/model-launchers";

interface PromptCardCopyButtonProps {
  promptId: string;
  promptText: string;
  /** When provided, the copy toast offers an "Open in <Model>" action. */
  modelSlug?: string;
}

/**
 * Premium inline copy button for prompt cards.
 *
 * Interaction:
 *   1. Click → clipboard write
 *   2. Icon morphs: Copy → Check with spring scale
 *   3. Ripple pulse radiates outward
 *   4. Button glows primary briefly
 *   5. Toast confirms
 *   6. Reverts after 1.8s
 *
 * Stops link propagation so the parent card doesn't navigate.
 */
export function PromptCardCopyButton({
  promptId,
  promptText,
  modelSlug,
}: PromptCardCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [animating, setAnimating] = useState(false);

  const launcher = getModelLauncher(modelSlug);

  async function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setAnimating(true);
      toast.success("Prompt copied", {
        description: "Paste it into your AI tool.",
        action: launcher
          ? {
              label: launcher.label,
              onClick: () => {
                window.open(
                  launcher.build(promptText),
                  "_blank",
                  "noopener",
                );
              },
            }
          : undefined,
      });
      // fire-and-forget telemetry + guest-funnel signal
      fetch(`/api/prompts/${promptId}/copy`, { method: "POST" }).catch(() => {});
      void notifyGuestCopy();
      setTimeout(() => setCopied(false), 1800);
      setTimeout(() => setAnimating(false), 550);
    } catch {
      toast.error("Couldn't copy", {
        description: "Open the prompt to copy manually.",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? "Copied" : "Copy prompt"}
      className={`press relative grid size-8 place-items-center overflow-hidden rounded-lg transition-all duration-200 ${
        copied
          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.66_0.21_270_/_0.3)]"
          : "text-muted-foreground hover:bg-primary/8 hover:text-primary"
      } ${animating ? "animate-copy-ripple" : ""}`}
    >
      {/* Check icon — revealed on copy */}
      <span
        className={`absolute transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          copied
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 -rotate-45 opacity-0"
        }`}
      >
        <CheckIcon className="size-3.5" strokeWidth={2.5} />
      </span>

      {/* Copy icon — default state */}
      <span
        className={`absolute transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          copied
            ? "scale-0 rotate-45 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        }`}
      >
        <CopyIcon className="size-3.5" strokeWidth={1.8} />
      </span>
    </button>
  );
}
