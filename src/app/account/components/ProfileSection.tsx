"use client";

import {
  ExternalLinkIcon,
  Loader2Icon,
  PencilIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";

interface Props {
  initial: {
    handle: string;
    fullName: string | null;
    bio: string | null;
  };
}

export function ProfileSection({ initial }: Props) {
  const [profile, setProfile] = useState(initial);
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState(initial.handle);
  const [fullName, setFullName] = useState(initial.fullName ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  const profileUrl = `/u/${profile.handle}`;

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setHandleError(null);
    try {
      const patch: Record<string, unknown> = {};
      if (handle.trim() !== profile.handle) patch.handle = handle.trim();
      if (fullName.trim() !== (profile.fullName ?? "")) {
        patch.fullName = fullName.trim() || null;
      }
      if (bio.trim() !== (profile.bio ?? "")) {
        patch.bio = bio.trim() || null;
      }
      if (Object.keys(patch).length === 0) {
        setOpen(false);
        return;
      }
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "handle_taken" || data?.code === "invalid_handle") {
          setHandleError(data.error);
        } else {
          toast.error(data?.error ?? "Couldn't save profile");
        }
        return;
      }
      setProfile({
        handle: data.profile.handle,
        fullName: data.profile.fullName,
        bio: data.profile.bio,
      });
      setHandle(data.profile.handle);
      toast.success("Profile updated");
      setOpen(false);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="reveal mb-8 rounded-xl border border-border/60 bg-card/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5">
            <UserIcon className="size-3" /> Creator profile
          </p>
          <p className="font-mono text-[13px] text-foreground">
            @{profile.handle}
          </p>
          {profile.bio ? (
            <p className="mt-1.5 max-w-prose text-[12.5px] leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Add a short bio so people know who&apos;s behind your prompts.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            data-icon="inline-end"
          >
            <Link href={profileUrl}>
              View public page
              <ExternalLinkIcon className="size-3.5" />
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setOpen(true)}
            data-icon="inline-start"
          >
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Your handle is part of your public URL at{" "}
              <code>/u/&lt;handle&gt;</code>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium">Handle</span>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background pl-2 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/30">
                <span className="text-[13px] text-muted-foreground">@</span>
                <input
                  value={handle}
                  onChange={(e) => {
                    setHandle(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_-]/g, ""),
                    );
                    setHandleError(null);
                  }}
                  minLength={3}
                  maxLength={32}
                  disabled={saving}
                  className="h-9 w-full bg-transparent text-[14px] outline-none"
                />
              </div>
              {handleError ? (
                <p className="text-[11px] text-destructive">{handleError}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  3–32 chars · letters, numbers, dash, underscore
                </p>
              )}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium">
                Display name{" "}
                <span className="text-muted-foreground">(optional)</span>
              </span>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={80}
                disabled={saving}
                placeholder="How you want to be credited"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium">
                Bio{" "}
                <span className="text-muted-foreground">(optional)</span>
              </span>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                disabled={saving}
                rows={3}
                placeholder="A one-liner — what you make prompts for."
              />
              <p className="self-end font-mono text-[10px] text-muted-foreground">
                {bio.length}/280
              </p>
            </label>

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
              <Button
                type="submit"
                size="sm"
                disabled={saving || handle.trim().length < 3}
              >
                {saving ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
