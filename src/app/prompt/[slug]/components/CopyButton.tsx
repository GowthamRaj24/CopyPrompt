"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CopyButtonProps {
  promptId: string;
  promptText: string;
  /** Optional - copy with parameters as JSON appended */
  withParams?: Record<string, unknown> | null;
}

/**
 * The most important button in the app.
 *
 * Click (or `C` anywhere) → clipboard, satisfying scale-pulse, indigo glow.
 * Briefly morphs to checkmark + "Copied" before reverting.
 * Fire-and-forget POST /api/prompts/[id]/copy increments counter.
 */
export function CopyButton({
  promptId,
  promptText,
  withParams,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [animating, setAnimating] = useState(false);

  async function copy(textToCopy: string, label: string) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setAnimating(true);
      toast.success("Prompt copied", { description: label });
      fetch(`/api/prompts/${promptId}/copy`, { method: "POST" }).catch(() => {});
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setAnimating(false), 500);
    } catch {
      toast.error("Couldn't copy", {
        description:
          "Your browser blocked clipboard access. Select the text manually.",
      });
    }
  }

  function copyJustPrompt() {
    void copy(promptText, "Paste it into your AI tool.");
  }

  function copyWithParams() {
    if (!withParams || Object.keys(withParams).length === 0) {
      copyJustPrompt();
      return;
    }
    const combined = `${promptText}\n\n--- Parameters ---\n${JSON.stringify(withParams, null, 2)}`;
    void copy(combined, "Prompt + parameters copied.");
  }

  // Keyboard shortcut: 'C' — global, except in inputs
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey) return;
      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        copyJustPrompt();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptText]);

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={copyJustPrompt}
        className={`magnetic relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary text-primary-foreground shadow-[0_1px_2px_0_oklch(0_0_0/0.15),inset_0_1px_0_0_oklch(1_0_0/0.1),0_4px_12px_-4px_oklch(0.66_0.21_270_/_0.35)] transition-all duration-150 hover:bg-primary/90 hover:shadow-[0_1px_2px_0_oklch(0_0_0/0.15),inset_0_1px_0_0_oklch(1_0_0/0.1),0_8px_20px_-6px_oklch(0.66_0.21_270_/_0.45)] md:h-12 ${
          animating ? "animate-copy-success" : ""
        }`}
      >
        <span
          className={`flex items-center gap-2 transition-all duration-150 ${
            copied ? "scale-50 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <CopyIcon className="size-3.5" strokeWidth={2} />
          <span className="text-[13px] font-semibold tracking-[-0.005em] md:text-[14px]">
            Copy prompt
          </span>
          <kbd className="ml-1 hidden rounded border border-white/15 bg-white/8 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider sm:inline-block">
            C
          </kbd>
        </span>
        <span
          className={`absolute flex items-center gap-2 transition-all duration-150 ${
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <CheckIcon className="size-3.5" strokeWidth={2.5} />
          <span className="text-[13px] font-semibold tracking-[-0.005em] md:text-[14px]">
            Copied to clipboard
          </span>
        </span>
      </button>

      {withParams && Object.keys(withParams).length > 0 && (
        <button
          type="button"
          onClick={copyWithParams}
          className="self-start text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          or copy with parameters →
        </button>
      )}
    </div>
  );
}
