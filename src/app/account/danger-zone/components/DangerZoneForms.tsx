"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

interface Props {
  isAdmin: boolean;
  email: string;
}

const CONFIRM_PHRASE = "DELETE";

/**
 * Client island for the danger-zone screen.
 *
 * Two interactive pieces:
 *   1. Export — calls GET /api/account/export, which streams a file with
 *      Content-Disposition: attachment. We trigger it via a plain
 *      <a download> so the browser's native save dialog handles UX.
 *   2. Delete — gated by typing "DELETE" verbatim. POST returns 204 on
 *      success; we hard-navigate to `/?deleted=1` to force a fresh
 *      session-less load.
 */
export function DangerZoneForms({ isAdmin, email }: Props) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const canDelete = !isAdmin && confirmInput === CONFIRM_PHRASE;

  async function handleExport() {
    setExporting(true);
    try {
      // Trigger the download via a synthetic anchor. fetch+blob would work
      // too, but the anchor approach lets the browser show its own download
      // chrome and reuses the response's Content-Disposition.
      const res = await fetch("/api/account/export", { method: "GET" });
      if (!res.ok) {
        toast.error("Export failed", {
          description: "Please refresh and try again.",
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `copyprompt-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started", { icon: <CheckCircle2Icon /> });
    } catch {
      toast.error("Network error");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    if (!canDelete || deleting) return;

    const ok = window.confirm(
      `This will permanently delete the account for ${email}.\n\n` +
        "Your favorites and ratings will be erased. Public prompts you " +
        "authored will remain on the site but become anonymous.\n\n" +
        "This action cannot be undone. Continue?",
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRM_PHRASE }),
      });

      if (res.status === 204) {
        toast.success("Account deleted");
        // Hard reload so the now-invalid session cookie is fully cleared
        // before React Router state can mount a private page.
        window.location.assign("/?deleted=1");
        return;
      }

      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error("Could not delete account", {
        description: body.error ?? "Try again in a moment.",
      });
      setDeleting(false);
    } catch {
      toast.error("Network error");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="press mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {exporting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <DownloadIcon className="size-4" />
            Download .json
          </>
        )}
      </button>

      {/* Delete — visually separated, intentionally heavy */}
      <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/[0.04] p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
            <Trash2Icon className="size-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold tracking-[-0.005em] text-destructive">
              Delete account
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Removes your profile, favorites, and ratings. Submissions and
              published prompts stay (anonymized) so the public catalog
              isn&apos;t broken for other users.
            </p>
            <ul className="mt-3 space-y-1 text-[12.5px] leading-relaxed text-muted-foreground">
              <li>· Cannot be undone</li>
              <li>· Sign-in stops working immediately</li>
              <li>· Email is freed up for re-registration</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleDelete} className="mt-5 space-y-3">
          <label
            htmlFor="confirm-delete"
            className="block text-[12.5px] font-medium text-foreground"
          >
            Type{" "}
            <span className="font-mono font-semibold text-destructive">
              {CONFIRM_PHRASE}
            </span>{" "}
            to confirm
          </label>
          <input
            id="confirm-delete"
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={isAdmin || deleting}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={CONFIRM_PHRASE}
            className="h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-[14px] tracking-wider focus-visible:border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!canDelete || deleting}
            className="press inline-flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-[13px] font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <AlertTriangleIcon className="size-4" />
                Delete account permanently
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
