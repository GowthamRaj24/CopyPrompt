"use client";

import {
  EyeIcon,
  Link2Icon,
  Loader2Icon,
  LockIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props {
  collectionId: string;
  slug: string;
  initialName: string;
  initialDescription: string | null;
  initialIsPublic: boolean;
}

export function CollectionDetailClient({
  collectionId,
  slug,
  initialName,
  initialDescription,
  initialIsPublic,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);

  const publicUrl = `/c/${slug}`;

  async function saveEdits(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Couldn't save");
        return;
      }
      toast.success("Saved");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  async function deleteCollection() {
    setPending(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Couldn't delete");
        return;
      }
      toast.success("Collection deleted");
      router.push("/account/collections");
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  async function copyPublicLink() {
    try {
      const origin = window.location.origin;
      await navigator.clipboard.writeText(`${origin}${publicUrl}`);
      toast.success("Public link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {initialIsPublic && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyPublicLink}
          data-icon="inline-start"
        >
          <Link2Icon className="size-3.5" />
          Copy public link
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setEditing(true)}
        data-icon="inline-start"
      >
        <PencilIcon className="size-3.5" />
        Edit
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirmDelete(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        data-icon="inline-start"
      >
        <Trash2Icon className="size-3.5" />
        Delete
      </Button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit collection</DialogTitle>
            <DialogDescription>
              Public collections get a shareable URL at <code>/c/{slug}</code>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEdits} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium">Name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                disabled={pending}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </span>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={280}
                disabled={pending}
                placeholder="A short pitch — shown on the public page"
              />
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-border/60 bg-card/50 p-3">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={pending}
                className="mt-0.5 size-4 rounded border-border accent-primary"
              />
              <div className="text-[12px]">
                <p className="flex items-center gap-1 font-medium">
                  {isPublic ? (
                    <EyeIcon className="size-3" />
                  ) : (
                    <LockIcon className="size-3" />
                  )}
                  {isPublic ? "Public" : "Private"}
                </p>
                <p className="text-muted-foreground">
                  {isPublic
                    ? "Anyone with the link can view this collection."
                    : "Only you can see this collection."}
                </p>
              </div>
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={pending || name.trim().length === 0}
              >
                {pending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this collection?</DialogTitle>
            <DialogDescription>
              This removes the board. The prompts inside stay safe in the
              public catalog — only the board is deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={deleteCollection}
              disabled={pending}
            >
              {pending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                "Delete collection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
