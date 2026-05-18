"use client";

import {
  BookmarkIcon,
  CheckIcon,
  FolderPlusIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type MouseEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase-client";

interface SaveToCollectionButtonProps {
  promptId: string;
  /** Optional visual style — defaults to a small icon-only button. */
  variant?: "icon" | "inline";
  className?: string;
}

interface CollectionRow {
  id: string;
  name: string;
  isPublic: boolean;
  promptCount: number;
}

interface MembershipResponse {
  collections: CollectionRow[];
  memberOf: string[];
}

/**
 * Save-to-collection picker.
 *
 * Behaviour:
 *   - Auth-gated; signed-out users are redirected to /signin with `next`.
 *   - First click opens a dialog and lazily fetches the membership state.
 *   - Toggling a checkbox writes immediately (POST add / DELETE remove)
 *     with optimistic UI; failure reverts the row.
 *   - "+ New collection" appends inline without leaving the dialog.
 *   - Closes on outside click; latest selections persist.
 *
 * Designed to drop into both `PromptCard` (icon variant, inside a card
 * link → click stops propagation) and `ActionsBar` (inline label variant).
 */
export function SaveToCollectionButton({
  promptId,
  variant = "icon",
  className,
}: SaveToCollectionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const isSaved = memberOf.size > 0;

  const fetchMembership = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/membership/${promptId}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Couldn't load your collections");
        return;
      }
      const data = (await res.json()) as MembershipResponse;
      setCollections(data.collections);
      setMemberOf(new Set(data.memberOf));
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  // Lightweight initial fetch on mount so the icon can reflect saved state
  // without opening the picker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/collections/membership/${promptId}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as MembershipResponse;
        if (cancelled) return;
        setCollections(data.collections);
        setMemberOf(new Set(data.memberOf));
      } catch {
        // silent — picker still works when opened
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [promptId]);

  async function openPicker(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      toast("Sign in to save to a collection");
      router.push(`/signin?next=${next}`);
      return;
    }

    setOpen(true);
    void fetchMembership();
  }

  async function togglePrompt(collectionId: string) {
    if (pendingIds.has(collectionId)) return;
    const wasMember = memberOf.has(collectionId);

    // Optimistic UI
    setPendingIds((prev) => new Set(prev).add(collectionId));
    setMemberOf((prev) => {
      const next = new Set(prev);
      if (wasMember) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });

    try {
      let res: Response;
      if (wasMember) {
        res = await fetch(
          `/api/collections/${collectionId}/prompts/${promptId}`,
          { method: "DELETE" },
        );
      } else {
        res = await fetch(`/api/collections/${collectionId}/prompts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId }),
        });
      }

      if (!res.ok) {
        // Revert
        setMemberOf((prev) => {
          const next = new Set(prev);
          if (wasMember) next.add(collectionId);
          else next.delete(collectionId);
          return next;
        });
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Couldn't update collection");
        return;
      }

      toast.success(
        wasMember ? "Removed from collection" : "Saved to collection",
      );
      // Update local count
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                promptCount: wasMember
                  ? Math.max(0, c.promptCount - 1)
                  : c.promptCount + 1,
              }
            : c,
        ),
      );
    } catch {
      setMemberOf((prev) => {
        const next = new Set(prev);
        if (wasMember) next.add(collectionId);
        else next.delete(collectionId);
        return next;
      });
      toast.error("Network error");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    }
  }

  async function createInline(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Couldn't create collection");
        return;
      }
      const created = data.collection as CollectionRow & { slug: string };
      setCollections((prev) => [
        { ...created, promptCount: 0 },
        ...prev,
      ]);
      setNewName("");
      setShowCreate(false);
      // Auto-add the prompt to the newly created collection.
      await togglePrompt(created.id);
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  }

  const buttonClass =
    className ??
    (variant === "icon"
      ? "press grid size-8 place-items-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-primary"
      : "press inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-2.5 text-[12px] font-medium text-foreground transition-all hover:border-border hover:bg-card");

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        aria-label={isSaved ? "Saved to a collection" : "Save to collection"}
        aria-pressed={isSaved}
        className={buttonClass}
      >
        <BookmarkIcon
          className={`size-3.5 ${
            isSaved ? "fill-primary stroke-primary" : ""
          }`}
          strokeWidth={1.8}
        />
        {variant === "inline" && (
          <span>{isSaved ? "Saved" : "Save"}</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkIcon className="size-4 text-primary" strokeWidth={2} />
              Save to collection
            </DialogTitle>
            <DialogDescription>
              Organize prompts into boards you can share later.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
            </div>
          ) : (
            <div className="-mx-1 max-h-[320px] space-y-1 overflow-y-auto px-1">
              {collections.length === 0 && !showCreate && (
                <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-[12px] text-muted-foreground">
                  No collections yet. Create your first one.
                </p>
              )}

              {collections.map((c) => {
                const checked = memberOf.has(c.id);
                const isPending = pendingIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => togglePrompt(c.id)}
                    disabled={isPending}
                    className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-wait ${
                      checked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/40 bg-card/40 hover:border-primary/30 hover:bg-primary/[0.03]"
                    }`}
                  >
                    <span
                      className={`grid size-5 place-items-center rounded-md border transition-colors ${
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      }`}
                      aria-hidden
                    >
                      {isPending ? (
                        <Loader2Icon className="size-3 animate-spin" />
                      ) : checked ? (
                        <CheckIcon className="size-3" strokeWidth={3} />
                      ) : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[13px] font-medium">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.promptCount} {c.promptCount === 1 ? "prompt" : "prompts"} ·{" "}
                        {c.isPublic ? "Public" : "Private"}
                      </p>
                    </div>
                  </button>
                );
              })}

              {showCreate ? (
                <form
                  onSubmit={createInline}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-2"
                >
                  <Input
                    autoFocus
                    placeholder="Collection name…"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={80}
                    disabled={creating}
                    className="h-8 text-[13px]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creating || newName.trim().length === 0}
                  >
                    {creating ? (
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      "Create"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCreate(false);
                      setNewName("");
                    }}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="press flex w-full items-center gap-2.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.03] hover:text-primary"
                >
                  <span className="grid size-5 place-items-center rounded-md border border-dashed border-border bg-background">
                    <PlusIcon className="size-3" strokeWidth={2.5} />
                  </span>
                  New collection
                </button>
              )}
            </div>
          )}

          <div className="-mx-4 -mb-4 flex items-center justify-between border-t border-border/40 bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FolderPlusIcon className="size-3" /> Free plan: up to 5
              collections
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px] font-medium text-foreground hover:text-primary"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
