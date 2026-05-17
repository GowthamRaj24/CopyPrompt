import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import {
  UploadError,
  uploadPromptImage,
} from "@/server/services/upload.service";

/**
 * Body-size enforcement
 * ─────────────────────
 * The Pages-Router `export const config = { api: { sizeLimit: ... } }`
 * pattern is deprecated in the App Router (Next.js fails the build on
 * encounter). The upload service itself enforces MAX_UPLOAD_BYTES on the
 * `File` after `formData()` parses it, and Supabase Storage ALSO enforces
 * its own `fileSizeLimit` (set in `scripts/setup-storage.ts`) — defense
 * in depth even if a buggy client tries to slip past us.
 */

/**
 * POST /api/uploads/image
 *
 * Form-data field `file` — single image, max 5 MB, JPEG/PNG/WebP/GIF.
 *
 * Returns JSON `{ url, path, mime, size }` on success.
 * The client stores the `url` as a submission image URL.
 *
 * Auth: required. Anonymous uploads would let anyone fill our bucket.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to upload images." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing `file` form field." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await uploadPromptImage(user.id, file);
    return NextResponse.json(
      {
        url: result.publicUrl,
        path: result.path,
        mime: result.mime,
        size: result.size,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[/api/uploads/image] failed:", err);
    return NextResponse.json(
      { error: "Upload failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

// App Router runtime config — individual exports only.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;
