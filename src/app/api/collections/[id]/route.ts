import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import {
  deleteCollection,
  getOwnedCollection,
  updateCollection,
} from "@/server/services/collection.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

interface Context {
  params: Promise<{ id: string }>;
}

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(280).nullable().optional(),
    isPublic: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.description !== undefined ||
      v.isPublic !== undefined,
    { message: "Provide at least one field to update" },
  );

/** GET /api/collections/[id] — owner-only collection detail. */
export async function GET(_req: NextRequest, ctx: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  const { id } = await ctx.params;
  const collection = await getOwnedCollection(user.id, id);
  if (!collection) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: NO_STORE },
    );
  }
  return NextResponse.json({ collection }, { headers: NO_STORE });
}

/** PATCH /api/collections/[id] — rename / description / visibility toggle. */
export async function PATCH(req: NextRequest, ctx: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const collection = await updateCollection(user, id, parsed.data);
    return NextResponse.json({ collection }, { headers: NO_STORE });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Collection not found" ? 404 : 400;
    return NextResponse.json(
      { error: message },
      { status, headers: NO_STORE },
    );
  }
}

/** DELETE /api/collections/[id] — owner only; cascade removes membership rows. */
export async function DELETE(_req: NextRequest, ctx: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  const { id } = await ctx.params;
  try {
    await deleteCollection(user, id);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Collection not found" ? 404 : 400;
    return NextResponse.json(
      { error: message },
      { status, headers: NO_STORE },
    );
  }
}
