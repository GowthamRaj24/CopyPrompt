"use client";

import { CheckCircle2Icon, CopyIcon, Share2Icon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildOwnPromptShareMessage } from "@/lib/utm";

function SharedSuccessContent() {
  const searchParams = useSearchParams();
  const shareUrl = searchParams.get("url") ?? "";
  const title = searchParams.get("title") ?? "Your prompt";
  const [copied, setCopied] = useState(false);

  const shareMessage = shareUrl
    ? buildOwnPromptShareMessage({ url: shareUrl, title })
    : null;

  async function copyLink() {
    if (!shareUrl || !shareMessage) return;
    try {
      // Copy the full marketing blurb + URL, not just the bare URL —
      // so when the user pastes into WhatsApp / Slack / DM their
      // recipient sees a 1-line value prop above the link.
      await navigator.clipboard.writeText(shareMessage.clipboard);
      setCopied(true);
      toast.success("Share message copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the link and copy manually");
    }
  }

  async function shareNative() {
    if (!shareUrl || !shareMessage) return;
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title,
        text: shareMessage.text,
        url: shareMessage.url,
      });
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="submit-studio relative flex min-h-[75svh] items-center justify-center px-4 py-16">
      <div className="submit-studio-ambient" aria-hidden />
      <div className="submit-panel relative mx-auto w-full max-w-lg p-8 text-center sm:p-10">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-violet-500/30 bg-violet-500/15 text-violet-400">
          <CheckCircle2Icon className="size-8" strokeWidth={1.8} />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet-400">
          Private · Live
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-[-0.03em]">
          Your link is ready
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Share on social or with clients. Only people with this link can view{" "}
          <span className="font-medium text-foreground">{title}</span>.
        </p>

        {shareUrl ? (
          <div className="mt-8 space-y-3 text-left">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Share link
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="h-11 flex-1 font-mono text-[12px]"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 gap-1.5"
                onClick={() => void copyLink()}
              >
                <CopyIcon className="size-3.5" />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-3">
              <Button
                type="button"
                className="gap-1.5"
                onClick={() => void shareNative()}
              >
                <Share2Icon className="size-3.5" />
                Share
              </Button>
              <Button variant="outline" asChild>
                <Link href="/account#my-prompts">My prompts</Link>
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-[13px] text-muted-foreground">
            <Link href="/account#my-prompts" className="text-primary underline">
              View in My prompts
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function SharedSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50svh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SharedSuccessContent />
    </Suspense>
  );
}
