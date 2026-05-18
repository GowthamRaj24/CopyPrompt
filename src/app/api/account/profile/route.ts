import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import {
  HandleTakenError,
  InvalidHandleError,
  getCreatorById,
  updateProfile,
} from "@/server/services/creator.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

const patchSchema = z
  .object({
    handle: z.string().trim().min(3).max(32).optional(),
    fullName: z.string().trim().max(80).nullable().optional(),
    bio: z.string().trim().max(280).nullable().optional(),
  })
  .refine(
    (v) =>
      v.handle !== undefined || v.fullName !== undefined || v.bio !== undefined,
    { message: "Provide at least one field to update." },
  );

/** GET /api/account/profile — current creator profile (handle + bio + avatar) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  const profile = await getCreatorById(user.id);
  if (!profile) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: NO_STORE },
    );
  }
  return NextResponse.json({ profile }, { headers: NO_STORE });
}

/** PATCH /api/account/profile — edit handle / display name / bio */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const profile = await updateProfile(user.id, parsed.data);
    return NextResponse.json({ profile }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof HandleTakenError) {
      return NextResponse.json(
        { error: err.message, code: "handle_taken" },
        { status: 409, headers: NO_STORE },
      );
    }
    if (err instanceof InvalidHandleError) {
      return NextResponse.json(
        { error: err.message, code: "invalid_handle" },
        { status: 400, headers: NO_STORE },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE },
    );
  }
}
