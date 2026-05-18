"use client";

import {
  BellIcon,
  CheckIcon,
  Loader2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase-client";

interface Props {
  query: string;
  type: "all" | "image" | "text";
  sort: "relevance" | "popular" | "latest" | "views" | "rated";
  /** Hide the button when there is nothing meaningful to save. */
  total: number;
}

/**
 * "Save this search" CTA on `/search`.
 *
 * Renders nothing for unsigned visitors after a first click — instead
 * routes them to /signin?next=... so the URL preserves their filters.
 *
 * Signed-in flow: opens a small dialog that lets the user edit a label
 * before POSTing to /api/saved-searches.
 */
export function SaveSearchButton({ query, type, sort, total }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedThisSession, setSavedThisSession] = useState(false);

  // Reset the "just saved" indicator when filters change.
  useEffect(() => {
    setSavedThisSession(false);
    setLabel("");
  }, []);

  if (total === 0 && !query && type === "all") {
    // Nothing worth alerting on.
    return null;
  }

  async function openOrSignIn() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (type !== "all") params.set("type", type);
      if (sort !== "relevance") params.set("sort", sort);
      const search = params.toString() ? `?${params.toString()}` : "";
      const next = encodeURIComponent(`/search${search}`);
      toast("Sign in to save search alerts");
      router.push(`/signin?next=${next}`);
      return;
    }
    setLabel(query || (type === "image" ? "New image prompts" : "New prompts"));
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || undefined,
          query: query || undefined,
          type,
          sort,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Couldn't save");
        return;
      }
      toast.success("Search saved", {
        description: "We'll email you when new prompts match.",
      });
      setOpen(false);
      setSavedThisSession(true);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openOrSignIn}
        data-icon="inline-start"
        disabled={savedThisSession}
      >
        {savedThisSession ? (
          <>
            <CheckIcon className="size-3.5" /> Saved
          </>
        ) : (
          <>
            <BellIcon className="size-3.5" /> Save search
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save this search</DialogTitle>
            <DialogDescription>
              You&apos;ll get an email when new prompts match these filters.
              Manage alerts at <code>/account/searches</code>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium">Label</span>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={80}
                placeholder="e.g. Cyberpunk portraits"
              />
            </label>

            <dl className="rounded-lg border border-border/40 bg-card/40 px-3 py-2 text-[12px]">
              <Row label="Query">{query || "—"}</Row>
              <Row label="Type">{type === "all" ? "Any" : type}</Row>
              <Row label="Sort">{sort}</Row>
            </dl>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  "Save alert"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="truncate text-foreground">{children}</dd>
    </div>
  );
}
