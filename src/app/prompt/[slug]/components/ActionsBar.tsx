"use client";

import {
  RefreshCwIcon,
  Share2Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SaveToCollectionButton } from "@/components/collections/SaveToCollectionButton";
import { createClient } from "@/lib/supabase-client";
import { buildPromptShareMessage } from "@/lib/utm";

interface ActionsBarProps {
  promptId: string;
  promptSlug: string;
  promptTitle: string;
  /** Model name shown in the share message ("Claude Sonnet", "Midjourney", …). */
  modelName: string;
  /** Image vs text changes the emoji + noun in the share blurb. */
  modelType: "image" | "text";
  /**
   * Optional override. When omitted the bar hydrates its rating
   * client-side via `GET /api/prompts/[id]/rate`, which lets the parent
   * page stay cacheable / non-user-specific on the server.
   */
  initialRating?: 1 | -1 | null;
}

type RatingValue = 1 | -1;

export function ActionsBar({
  promptId,
  promptSlug,
  promptTitle,
  modelName,
  modelType,
  initialRating,
}: ActionsBarProps) {
  const router = useRouter();
  const [rating, setRating] = useState<RatingValue | null>(
    initialRating ?? null,
  );
  const [pending, setPending] = useState(false);

  // Hydrate from API when no server-rendered initial value was supplied.
  useEffect(() => {
    if (initialRating !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/prompts/${promptId}/rate`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { rating: 1 | -1 | null };
        if (!cancelled && (data.rating === 1 || data.rating === -1)) {
          setRating(data.rating);
        }
      } catch {
        // Silent — sign-out and network errors both fall back to "not rated".
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [promptId, initialRating]);

  async function ensureSignedIn(intent: string): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      toast(`Sign in to ${intent}`);
      router.push(`/signin?next=${next}`);
      return null;
    }
    return user.id;
  }

  async function handleShare() {
    const message = buildPromptShareMessage({
      slug: promptSlug,
      title: promptTitle,
      modelName,
      modelType,
    });
    // Web Share API (mobile + modern desktop): the OS combines `text`
    // and `url` cleanly in the target app, so WhatsApp shows the
    // marketing blurb above the URL and the URL still unfurls to our
    // OG card below.
    if (navigator.share) {
      try {
        await navigator.share({
          title: promptTitle,
          text: message.text,
          url: message.url,
        });
      } catch {
        // cancelled — silent
      }
      return;
    }
    // Desktop fallback: copy the blurb + URL together so pasting into
    // any chat / email / doc surfaces both pieces — not just a bare
    // tracking URL like before.
    try {
      await navigator.clipboard.writeText(message.clipboard);
      toast.success("Share message copied — paste anywhere");
    } catch {
      toast.error("Couldn't copy share message");
    }
  }

  async function handleRemix() {
    const userId = await ensureSignedIn("remix prompts");
    if (!userId) return;
    router.push(`/submit?remix_from=${encodeURIComponent(promptSlug)}`);
  }

  async function handleRate(value: RatingValue) {
    const userId = await ensureSignedIn("rate prompts");
    if (!userId) return;
    if (pending) return;

    // Optimistic: same vote → flips off (we don't currently support
    // un-rate via API, but we still flip the UI for fast feedback).
    const previous = rating;
    setRating(value);
    setPending(true);

    try {
      const res = await fetch(`/api/prompts/${promptId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      if (!res.ok) {
        setRating(previous);
        toast.error("Couldn't record rating. Try again.");
        return;
      }
      toast.success(value === 1 ? "Marked helpful" : "Marked not for me");
    } catch {
      setRating(previous);
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SaveToCollectionButton promptId={promptId} variant="inline" />
      <ActionButton
        onClick={handleShare}
        icon={<Share2Icon className="size-3" />}
      >
        Share
      </ActionButton>
      <ActionButton
        onClick={handleRemix}
        icon={<RefreshCwIcon className="size-3" />}
      >
        Remix
      </ActionButton>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">Helpful?</span>
        <RatingButton
          active={rating === 1}
          onClick={() => handleRate(1)}
          disabled={pending}
          icon={<ThumbsUpIcon className="size-3" strokeWidth={1.8} />}
          label="Mark helpful"
        />
        <RatingButton
          active={rating === -1}
          onClick={() => handleRate(-1)}
          disabled={pending}
          icon={<ThumbsDownIcon className="size-3" strokeWidth={1.8} />}
          label="Mark not for me"
        />
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-2.5 text-[12px] font-medium text-foreground transition-all hover:border-border hover:bg-card"
    >
      {icon}
      {children}
    </button>
  );
}

function RatingButton({
  active,
  onClick,
  disabled,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`press grid size-8 place-items-center rounded-lg border transition-all disabled:cursor-wait ${
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
      }`}
    >
      {icon}
    </button>
  );
}
