import { randomUUID } from "node:crypto";
import { env } from "@/server/config/env";
import { supabaseAdmin } from "@/server/lib/supabase-admin";

/**
 * Image-upload helpers backed by Supabase Storage.
 *
 * Why we proxy through our own API (instead of letting the browser hit
 * Supabase Storage directly)
 * ──────────────────────────────────────────────────────────────────
 *   • Single auth surface. The browser already authenticates with our
 *     API via the Next.js session cookie; introducing a second auth
 *     handshake to Supabase Storage doubles the failure modes.
 *   • Server-side validation. We can re-check size + MIME after the
 *     bytes arrive, ignore client-supplied filenames, and namespace
 *     paths by the verified userId — none of which is possible from
 *     the browser.
 *   • Rate-limiting and abuse controls happen on our route, not the
 *     storage layer.
 *
 * Trade-off: every upload byte goes through our server. At the scale of
 * a prompt-screenshot uploader (~5 MB max, ~200 uploads / day even at
 * 10k DAU) this is a non-issue. If it ever does become one, we move to
 * Supabase's `createSignedUploadUrl()` flow — same service, different
 * entrypoint.
 */

const BUCKET = env.SUPABASE_STORAGE_BUCKET ?? "prompt-images";

/** 5 MB — keep in sync with `scripts/setup-storage.ts`. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Allow-list. NEVER trust the client `Content-Type`; we re-derive it. */
export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadError extends Error {
  constructor(
    public code:
      | "too_large"
      | "bad_mime"
      | "empty"
      | "storage_error"
      | "no_supabase_url",
    message: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export interface UploadResult {
  /** Storage path inside the bucket (`submissions/<uid>/<uuid>.png`). */
  path: string;
  /** Fully-qualified public URL. Safe to store in `images.cdn_url`. */
  publicUrl: string;
  /** Size of the stored bytes. */
  size: number;
  /** Normalized MIME type (derived from bytes, not client-supplied). */
  mime: string;
}

/**
 * Upload an image on behalf of `userId`. Caller MUST verify the user is
 * authenticated; this function trusts the userId.
 *
 * Path layout (S3-style):
 *   submissions/{userId}/{uuid}.{ext}
 *
 * Why a per-user prefix
 * ─────────────────────
 *   • Easier to wipe on account deletion (one prefix delete cleans up).
 *   • Easier to add bucket policies later (e.g. "user X can only list
 *     submissions/X/*").
 *   • No collisions across users.
 */
export async function uploadPromptImage(
  userId: string,
  file: File,
): Promise<UploadResult> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new UploadError(
      "no_supabase_url",
      "Supabase URL not configured. Run `npm run db:setup-storage` first.",
    );
  }

  if (file.size <= 0) {
    throw new UploadError("empty", "Uploaded file is empty.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      "too_large",
      `File is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`,
    );
  }

  // Re-derive MIME from the first bytes. The client `type` is a hint only.
  // Supabase Storage's allowedMimeTypes also enforces this server-side,
  // but rejecting early gives the user a better error message.
  const mime = await sniffImageMime(file);
  if (!ALLOWED_MIME.has(mime)) {
    throw new UploadError(
      "bad_mime",
      "Only JPEG, PNG, WebP, and GIF images are allowed.",
    );
  }

  const ext = EXT_BY_MIME[mime];
  const path = `submissions/${userId}/${randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: mime,
      cacheControl: "31536000", // 1 year — files are immutable by path
      upsert: false,
    });

  if (error) {
    console.error("[uploadPromptImage] storage error:", error);
    throw new UploadError(
      "storage_error",
      "Storage rejected the upload. Please try again.",
    );
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
    size: file.size,
    mime,
  };
}

/**
 * Detect the real image MIME by inspecting magic bytes. Stops the obvious
 * "I renamed my .exe to .jpg" exploits before storage even sees the file.
 *
 * Supports: JPEG, PNG, WebP, GIF. Returns "" for anything else.
 */
async function sniffImageMime(file: File): Promise<string> {
  const sample = await file.slice(0, 16).arrayBuffer();
  const b = new Uint8Array(sample);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return "image/png";
  }
  // JPEG: starts with FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF: "GIF87a" or "GIF89a"
  if (
    b[0] === 0x47 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x38 &&
    (b[4] === 0x37 || b[4] === 0x39) &&
    b[5] === 0x61
  ) {
    return "image/gif";
  }
  // WebP: "RIFF????WEBP"
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "image/webp";
  }
  return "";
}
