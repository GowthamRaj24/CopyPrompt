"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
  title: string;
}

const QUICK_REASONS = [
  "Low quality output",
  "Duplicate of existing prompt",
  "Off-topic / not useful",
  "Inappropriate or NSFW content",
  "Image URLs broken or low-res",
  "Prompt is incomplete or unclear",
];

/**
 * Modal asking for a rejection reason. Quick-select chips speed up common cases.
 */
export function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  title,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject submission</DialogTitle>
          <DialogDescription>
            Tell the submitter why &ldquo;{title}&rdquo; was rejected. This will
            be sent to them via email if they provided one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>

          <div>
            <Label htmlFor="reject-reason" className="mb-1.5 block">
              Reason
            </Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Be specific so the submitter can improve next time."
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
          >
            {loading && <Loader2Icon className="size-4 animate-spin" />}
            Reject submission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
