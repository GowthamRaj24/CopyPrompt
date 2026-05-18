"use client";

import {
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { notifyGuestCopy } from "@/lib/guest-funnel";
import { getModelLauncher } from "@/lib/model-launchers";
import { createClient } from "@/lib/supabase-client";

interface CopyButtonProps {
  promptId: string;
  promptText: string;
  /** Optional - copy with parameters as JSON appended */
  withParams?: Record<string, unknown> | null;
  /** Drive the "Open in <Model>" deep-link CTA shown after copy. */
  modelSlug?: string;
  modelName?: string;
}

/**
 * The most important button in the app.
 *
 * Click (or `C` anywhere) → clipboard, satisfying scale-pulse, indigo glow.
 * Briefly morphs to checkmark + "Copied" before reverting.
 * Fire-and-forget POST /api/prompts/[id]/copy increments counter.
 */
type FeedbackState =
  | { kind: "hidden" }
  | { kind: "asking" }
  | { kind: "thanks"; rating: 1 | -1 }
  | { kind: "done" };

export function CopyButton({
  promptId,
  promptText,
  withParams,
  modelSlug,
  modelName,
}: CopyButtonProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: "hidden" });
  const [pendingFeedback, setPendingFeedback] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const launcher = getModelLauncher(modelSlug);

  const dismissFeedback = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    setFeedback({ kind: "done" });
  }, []);

  // Auto-collapse the panel ~12s after copy if the user doesn't vote.
  useEffect(() => {
    if (feedback.kind !== "asking") return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      setFeedback({ kind: "done" });
    }, 12_000);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [feedback.kind]);

  async function copy(textToCopy: string, label: string) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setAnimating(true);
      toast.success("Prompt copied", {
        description: label,
        action: launcher
          ? {
              label: launcher.label,
              onClick: () => {
                window.open(launcher.build(textToCopy), "_blank", "noopener");
              },
            }
          : undefined,
      });
      fetch(`/api/prompts/${promptId}/copy`, { method: "POST" }).catch(() => {});
      void notifyGuestCopy();
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setAnimating(false), 500);

      // Open the micro-feedback prompt — but only on the first copy
      // of this page-session, so power-users hammering "C" don't see
      // it on every press.
      setFeedback((prev) =>
        prev.kind === "hidden" ? { kind: "asking" } : prev,
      );
    } catch {
      toast.error("Couldn't copy", {
        description:
          "Your browser blocked clipboard access. Select the text manually.",
      });
    }
  }

  async function submitFeedback(rating: 1 | -1) {
    if (pendingFeedback) return;
    setPendingFeedback(true);
    try {
      // Auth-gated. Anonymous → soft prompt them to sign in via the
      // existing soft-signup nudge (the guest funnel already covers
      // copy-intent, so we don't dispatch again here).
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const next = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        toast("Sign in to rate this prompt");
        router.push(`/signin?next=${next}`);
        return;
      }

      const res = await fetch(`/api/prompts/${promptId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) {
        toast.error("Couldn't record rating");
        return;
      }
      setFeedback({ kind: "thanks", rating });
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => {
        setFeedback({ kind: "done" });
      }, 2200);
    } catch {
      toast.error("Network error");
    } finally {
      setPendingFeedback(false);
    }
  }

  function openInModel() {
    if (!launcher) return;
    window.open(launcher.build(promptText), "_blank", "noopener");
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

      {launcher && (
        <button
          type="button"
          onClick={openInModel}
          aria-label={modelName ? `${launcher.label} (${modelName})` : launcher.label}
          className="press group inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card/50 text-[12.5px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary md:h-10"
        >
          {launcher.label}
          <ArrowUpRightIcon className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      )}

      <FeedbackPanel
        state={feedback}
        pending={pendingFeedback}
        onVote={(r) => void submitFeedback(r)}
        onDismiss={dismissFeedback}
      />

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

function FeedbackPanel({
  state,
  pending,
  onVote,
  onDismiss,
}: {
  state: FeedbackState;
  pending: boolean;
  onVote: (rating: 1 | -1) => void;
  onDismiss: () => void;
}) {
  if (state.kind === "hidden" || state.kind === "done") return null;

  if (state.kind === "thanks") {
    return (
      <div className="reveal flex items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[12px] font-medium text-primary">
        <CheckIcon className="mr-1.5 size-3" strokeWidth={2.5} />
        {state.rating === 1 ? "Thanks — glad it worked." : "Thanks for the heads-up."}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Did this prompt help?"
      className="reveal flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 px-3 py-2"
    >
      <span className="text-[12px] font-medium text-foreground">
        Did this prompt help?
      </span>
      <div className="flex items-center gap-1">
        <FeedbackChip
          onClick={() => onVote(1)}
          icon={<ThumbsUpIcon className="size-3" strokeWidth={1.8} />}
          label="Yes"
          disabled={pending}
          tone="positive"
        />
        <FeedbackChip
          onClick={() => onVote(-1)}
          icon={<ThumbsDownIcon className="size-3" strokeWidth={1.8} />}
          label="No"
          disabled={pending}
          tone="neutral"
        />
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss feedback prompt"
          className="ml-1 text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function FeedbackChip({
  onClick,
  icon,
  label,
  disabled,
  tone,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  tone: "positive" | "neutral";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`press inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11.5px] font-medium transition-all disabled:cursor-wait ${
        tone === "positive"
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
