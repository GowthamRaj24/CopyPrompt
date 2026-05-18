import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import { PlanLimitError } from "@/server/lib/plan";
import {
  createCollection,
  listMyCollections,
} from "@/server/services/collection.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(280).optional(),
  isPublic: z.boolean().optional(),
});

/** GET /api/collections — list current user's collections. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  const rows = await listMyCollections(user.id);
  return NextResponse.json({ collections: rows }, { headers: NO_STORE });
}

/** POST /api/collections — create a new collection. */
export async function POST(req: NextRequest) {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const collection = await createCollection(user, parsed.data);
    return NextResponse.json({ collection }, { status: 201, headers: NO_STORE });
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code, upgradeTo: err.upgradeTo },
        { status: 403, headers: NO_STORE },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: NO_STORE },
    );
  }
}
