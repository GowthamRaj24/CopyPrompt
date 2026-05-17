"use client";

import { CheckCircle2Icon, CopyIcon, Share2Icon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_BRAND } from "@/lib/site-brand";

function SharedSuccessContent() {
  const searchParams = useSearchParams();
  const shareUrl = searchParams.get("url") ?? "";
  const title = searchParams.get("title") ?? "Your prompt";
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the link and copy manually");
    }
  }

  async function shareNative() {
    if (!shareUrl || !navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title,
        text: `Check out my prompt on ${SITE_BRAND.displayName}`,
        url: shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <section className="relative flex min-h-[70svh] items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[400px]"
      />
      <div className="relative w-full max-w-lg text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2Icon className="size-7" strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.03em]">
          Private prompt is live
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Share this link on social media. Only people with the link can view{" "}
          <span className="font-medium text-foreground">{title}</span> — it
          won&apos;t appear in search or browse.
        </p>

        {shareUrl ? (
          <div className="mt-8 space-y-3 text-left">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Your share link
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="h-11 font-mono text-[12px]"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 gap-1.5 px-3"
                onClick={() => void copyLink()}
              >
                <CopyIcon className="size-3.5" />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button
                type="button"
                className="gap-1.5"
                onClick={() => void shareNative()}
              >
                <Share2Icon className="size-3.5" />
                Share
              </Button>
              <Button variant="outline" asChild>
                <Link href="/account/prompts">My prompts</Link>
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-[13px] text-muted-foreground">
            Missing share URL. Check{" "}
            <Link href="/account/prompts" className="text-primary underline">
              My prompts
            </Link>
            .
          </p>
        )}
      </div>
    </section>
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
