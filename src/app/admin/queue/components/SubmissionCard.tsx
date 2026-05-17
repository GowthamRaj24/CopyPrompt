"use client";

import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown/Markdown";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { RejectDialog } from "./RejectDialog";

interface SubmissionCardProps {
  id: string;
  promptData: {
    type: "image" | "text";
    title: string;
    promptText: string;
    expectedOutcome?: string | null;
    modelSlug: string;
    categorySlug: string;
    tags: string[];
    tips?: string | null;
    negativePrompt?: string | null;
    imageUrls?: string[];
    params?: Record<string, unknown>;
  };
  email: string | null;
  createdAt: Date | string;
  showActions: boolean;
}

export function SubmissionCard({
  id,
  promptData,
  email,
  createdAt,
  showActions,
}: SubmissionCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const isImage = promptData.type === "image";
  const submittedAgo = formatRelativeTime(createdAt, "compact");

  async function handleApprove() {
    setBusy("approve");
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        toast.error("Could not approve", { description: errBody.error });
        setBusy(null);
        return;
      }
      const { slug } = await res.json();
      toast.success("Approved!", {
        description: `Now live at /prompt/${slug}`,
      });
      router.refresh();
    } catch {
      toast.error("Network error");
      setBusy(null);
    }
  }

  async function handleReject(reason: string) {
    setBusy("reject");
    try {
      const res = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        toast.error("Could not reject", { description: errBody.error });
        setBusy(null);
        return;
      }
      toast.success("Rejected");
      setRejectOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error");
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                isImage
                  ? "border-blue-400/30 bg-blue-400/10 text-blue-300"
                  : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {isImage ? "Image" : "Text"}
            </span>
            <span className="font-medium text-foreground">
              {promptData.modelSlug}
            </span>
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
            <span>{promptData.categorySlug}</span>
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
            <span>{submittedAgo}</span>
            {email && (
              <>
                <span aria-hidden className="text-muted-foreground/40">
                  ·
                </span>
                <span className="font-mono text-[10px]">
                  {maskEmail(email)}
                </span>
              </>
            )}
          </div>
          <h2 className="line-clamp-2 text-[16px] font-semibold tracking-[-0.01em]">
            {promptData.title}
          </h2>
        </div>
      </div>

      {/* Body: image previews (if image) + prompt text */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {isImage && promptData.imageUrls && promptData.imageUrls.length > 0 && (
          <div className="md:col-span-4">
            <div className="grid grid-cols-3 gap-2">
              {promptData.imageUrls.map((url, idx) => (
                <a
                  key={`${id}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-md border border-border bg-muted/40"
                >
                  {/* Plain img - submitted URLs aren't in next.config remotePatterns */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${promptData.title} ${idx + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div
          className={
            isImage && promptData.imageUrls?.length
              ? "md:col-span-8"
              : "md:col-span-12"
          }
        >
          {/* Prompt text */}
          <div className="rounded-md border border-border bg-background/60 p-3">
            <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
              Prompt
            </div>
            <pre className="m-0 max-h-40 overflow-auto border-0 bg-transparent p-0 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-foreground">
              {promptData.promptText}
            </pre>
          </div>

          {/* Expected outcome (text prompts) — rendered as markdown
              since AI sample outputs typically contain headings, lists,
              and emphasis that the admin needs to see formatted. */}
          {!isImage && promptData.expectedOutcome && (
            <div className="mt-2 rounded-md border border-border bg-background/60 p-3">
              <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
                Expected output
              </div>
              <Markdown
                content={promptData.expectedOutcome}
                className="max-h-32 overflow-auto"
              />
            </div>
          )}

          {/* Tags */}
          {promptData.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {promptData.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Tips — markdown so admins see the curator note as it'll
              appear on the live detail page. */}
          {promptData.tips && (
            <div className="mt-3 rounded-md border border-border bg-background/60 p-3">
              <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
                Tips
              </div>
              <Markdown
                content={promptData.tips}
                className="max-h-32 overflow-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      {showActions && (
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="magnetic h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={handleApprove}
            disabled={busy !== null}
          >
            {busy === "approve" ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            Approve
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="press h-9 rounded-md border-border text-[13px]"
            onClick={() => setRejectOpen(true)}
            disabled={busy !== null}
          >
            <XIcon className="size-4" />
            Reject
          </Button>
        </div>
      )}

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        loading={busy === "reject"}
        title={promptData.title}
      />
    </div>
  );
}

/**
 * Mask an email for display in the admin queue.
 * Reveals first 2 characters of local part + domain.
 *   "alice@example.com" → "al***@example.com"
 *   "bo@example.com"    → "bo@example.com" (too short to mask)
 */
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return email;
  return `${local.slice(0, 2)}***${domain}`;
}
