"use client";

import {
  DownloadIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  bumpVisitCounter,
  isInstallSuppressed,
  isIosBrowser,
  isRunningStandalone,
  recordInstallCompleted,
  recordInstallDismissed,
} from "@/lib/install-prompt-state";
import { SITE_BRAND } from "@/lib/site-brand";

/**
 * BeforeInstallPromptEvent isn't part of the lib.dom yet but it's the
 * standard Chrome/Edge install-prompt API. We type-narrow what we touch.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISIT_THRESHOLD = 2;

/**
 * Soft install prompt — appears at the bottom-right on the 2nd visit
 * once the browser fires `beforeinstallprompt`. iOS gets a Share-icon
 * hint instead (Safari has no programmatic install API).
 *
 * Dismiss flag = 7 days. Auto-disappears once installed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Visit-count bump runs once per mount (each navigation in client-side
  // routes doesn't remount the layout, so this fires per real page-load).
  useEffect(() => {
    if (isRunningStandalone()) return;
    if (isInstallSuppressed()) return;

    const visits = bumpVisitCounter();
    if (visits < VISIT_THRESHOLD) return;

    // iOS has no programmatic install — show our hint immediately.
    if (isIosBrowser()) {
      setIosHint(true);
      setOpen(true);
      return;
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    }
    window.addEventListener("beforeinstallprompt", handler as EventListener);

    function installed() {
      recordInstallCompleted();
      setOpen(false);
    }
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        recordInstallCompleted();
      } else {
        recordInstallDismissed();
      }
    } catch {
      // ignore — user cancelled or browser rejected
    } finally {
      setDeferred(null);
      setOpen(false);
      setInstalling(false);
    }
  }

  function handleDismiss() {
    recordInstallDismissed();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:bottom-5 sm:right-5 sm:left-auto sm:justify-end sm:px-0">
      <div
        role="dialog"
        aria-labelledby="pwa-install-title"
        className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-border/60 bg-card/95 p-3.5 shadow-soft backdrop-blur-xl"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <SparklesIcon className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="pwa-install-title"
            className="text-[13px] font-semibold tracking-[-0.01em]"
          >
            {iosHint
              ? `Add ${SITE_BRAND.name} to your home screen`
              : `Install ${SITE_BRAND.name}`}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            {iosHint
              ? "Tap the Share icon, then “Add to Home Screen” — quick access, offline favorites."
              : "Quick access, offline favorites, no app store."}
          </p>
          {!iosHint && (
            <div className="mt-2.5 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleInstall}
                disabled={installing || !deferred}
                data-icon="inline-start"
              >
                <DownloadIcon className="size-3.5" />
                Install
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                Maybe later
              </Button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="press -mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
