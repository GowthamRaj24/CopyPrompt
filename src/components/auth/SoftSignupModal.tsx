"use client";

import { HeartIcon, SparklesIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleButton } from "@/components/ui/google-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SOFT_SIGNUP_EVENT,
  type SoftSignupEventDetail,
  dismissSoftSignup,
} from "@/lib/guest-funnel";

/**
 * Global soft-signup nudge.
 *
 * Mounted once in `FavoritesProvider` (so it lives on every page that
 * renders the root layout). Subscribes to the `mcp:show-soft-signup`
 * window event from `guest-funnel.ts` — when fired, opens a friendly
 * modal that converts at peak intent without blocking browse/copy flow.
 */
export function SoftSignupModal() {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<"copy" | "favorite-attempt">("copy");
  const [returnTo, setReturnTo] = useState("/");

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<SoftSignupEventDetail>).detail;
      if (!detail) return;
      setTrigger(detail.trigger);
      // Capture the current URL at event time. We deliberately avoid
      // `useSearchParams()` because this modal is mounted globally in
      // `FavoritesProvider`, and that hook forces every static page
      // (including `/changelog` and `/_not-found`) into a dynamic-only
      // build path.
      if (typeof window !== "undefined") {
        setReturnTo(window.location.pathname + window.location.search);
      }
      setOpen(true);
    }
    window.addEventListener(SOFT_SIGNUP_EVENT, handler);
    return () => window.removeEventListener(SOFT_SIGNUP_EVENT, handler);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) dismissSoftSignup();
  }

  const next = returnTo || "/";
  const heroIcon =
    trigger === "favorite-attempt" ? (
      <HeartIcon className="size-4 fill-primary stroke-primary" />
    ) : (
      <SparklesIcon className="size-4" />
    );
  const heroTitle =
    trigger === "favorite-attempt"
      ? "Save this prompt to your library"
      : "Build your prompt library";
  const heroBlurb =
    trigger === "favorite-attempt"
      ? "Sign in to keep a list of prompts you love. It's free and takes 10 seconds."
      : "You're using mycopyprompt like a pro. Sign in to save favorites, build collections, and pick up where you left off — free, forever.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {heroIcon}
          </div>
          <DialogTitle className="text-[18px] font-bold tracking-[-0.02em]">
            {heroTitle}
          </DialogTitle>
          <DialogDescription>{heroBlurb}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 rounded-lg border border-border/40 bg-card/40 p-3 text-[12.5px]">
          <Benefit
            icon={<HeartIcon className="size-3" />}
            label="Favorites that follow you across devices"
          />
          <Benefit
            icon={<SparklesIcon className="size-3" />}
            label="Collections — organize prompts into boards"
          />
          <Benefit
            icon={<ZapIcon className="size-3" />}
            label='"Recently copied" so you never lose a winner'
          />
        </div>

        <GoogleButton
          label="Continue with Google"
          next={next}
        />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border/40" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-border/40" />
        </div>

        <div className="flex items-center justify-between gap-2 text-[12px]">
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            onClick={() => setOpen(false)}
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            Email signup →
          </Link>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Maybe later
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Already a member?{" "}
          <Link
            href={`/signin?next=${encodeURIComponent(next)}`}
            onClick={() => setOpen(false)}
            className="font-medium text-foreground hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Benefit({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-foreground/90">
      <span className="grid size-5 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
        {icon}
      </span>
      {label}
    </div>
  );
}
