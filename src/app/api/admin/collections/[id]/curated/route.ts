import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/server/lib/auth";
import { setCollectionCurated } from "@/server/services/collection.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

interface Context {
  params: Promise<{ id: string }>;
}

const schema = z.object({ isCurated: z.boolean() });

/**
 * PATCH /api/admin/collections/[id]/curated
 * Body: { isCurated: boolean }
 *
 * Toggles the `is_curated` flag — surfaces a public collection on the
 * homepage "Curated playbooks" row and the /collections index.
 */
export async function PATCH(req: NextRequest, ctx: Context) {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json(
      { error: "Missing id" },
      { status: 400, headers: NO_STORE },
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "isCurated boolean required" },
      { status: 400, headers: NO_STORE },
    );
  }

  await setCollectionCurated(id, parsed.data.isCurated);
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
