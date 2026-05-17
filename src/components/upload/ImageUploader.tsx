"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ImageIcon,
  Loader2Icon,
  Trash2Icon,
  UploadCloudIcon,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useId,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

/**
 * Drag-and-drop image uploader backed by /api/uploads/image (Supabase Storage).
 *
 * Behavior contract
 * ─────────────────
 *   • Accepts JPEG / PNG / WebP / GIF up to 5 MB.
 *   • On successful upload, calls `onUploaded(url)` with the public CDN URL.
 *   • On error, surfaces a toast and inline message. Never throws.
 *   • Progress is approximated (we use fetch, which doesn't expose progress
 *     on plain bodies; the spinner is honest because we don't claim a %).
 *   • Drag-and-drop, click-to-pick, and paste-from-clipboard all work.
 *
 * Accessibility
 * ─────────────
 *   • The drop area is also a button — Enter/Space opens the file picker.
 *   • `aria-busy` flips during upload so screen readers announce state.
 */

interface ImageUploaderProps {
  /** Fires when an upload completes and we have a final public URL. */
  onUploaded: (url: string) => void;
  /** Optional initial preview URL (e.g. user pasted then switched modes). */
  initialUrl?: string;
  /** Label shown when no image is present. */
  placeholder?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUploader({
  onUploaded,
  initialUrl,
  placeholder = "Drop an image, click to pick, or paste",
}: ImageUploaderProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        const msg = "That doesn't look like an image.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (file.size > MAX_BYTES) {
        const msg = `Too large. Max ${MAX_BYTES / 1024 / 1024} MB.`;
        setError(msg);
        toast.error(msg);
        return;
      }

      // Local object URL preview — instant feedback even before upload finishes.
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setBusy(true);

      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads/image", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          const msg = body.error ?? "Upload failed.";
          setError(msg);
          toast.error(msg);
          setPreviewUrl(null);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        const data = (await res.json()) as { url: string };
        // Swap to the canonical CDN URL so the form submits the right value.
        setPreviewUrl(data.url);
        onUploaded(data.url);
        URL.revokeObjectURL(objectUrl);
        toast.success("Image uploaded");
      } catch (err) {
        console.error("[ImageUploader] network error", err);
        setError("Network error. Please retry.");
        toast.error("Network error");
        setPreviewUrl(null);
        URL.revokeObjectURL(objectUrl);
      } finally {
        setBusy(false);
      }
    },
    [onUploaded],
  );

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
    // Reset so picking the same file twice still fires `change`.
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLLabelElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void uploadFile(file);
          break;
        }
      }
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    setError(null);
    onUploaded("");
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        aria-busy={busy}
        tabIndex={0}
        className={`group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors ${
          dragOver
            ? "border-primary/70 bg-primary/[0.06]"
            : previewUrl
              ? "border-border/70 bg-card/30"
              : "border-border/70 bg-card/20 hover:border-primary/40 hover:bg-primary/[0.03]"
        } ${busy ? "pointer-events-none opacity-90" : ""}`}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleInputChange}
          className="sr-only"
          disabled={busy}
        />

        {previewUrl ? (
          <>
            {/* biome-ignore lint/performance/noImgElement: ephemeral preview */}
            <img
              src={previewUrl}
              alt="Upload preview"
              className="size-full object-cover"
              draggable={false}
            />
            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                <Loader2Icon className="size-6 animate-spin text-primary" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <UploadCloudIcon className="size-5" />
            </span>
            <p className="text-[13px] font-medium text-foreground">
              {placeholder}
            </p>
            <p className="text-[11.5px]">
              JPEG, PNG, WebP, or GIF · max 5 MB
            </p>
          </div>
        )}
      </label>

      {previewUrl && !busy && (
        <div className="flex items-center justify-between gap-3">
          <p className="line-clamp-1 text-[11.5px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="-mt-0.5 mr-1 inline size-3" />
            Stored on your account.
          </p>
          <button
            type="button"
            onClick={handleRemove}
            className="press inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon className="size-3" />
            Remove
          </button>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-[11.5px] text-destructive"
        >
          <AlertCircleIcon className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}
