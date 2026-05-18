import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import { PlanLimitError } from "@/server/lib/plan";
import {
  createSavedSearch,
  listSavedSearchesForUser,
} from "@/server/services/saved-search.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

const createSchema = z.object({
  label: z.string().trim().max(80).optional(),
  query: z.string().trim().max(200).optional(),
  type: z.enum(["all", "image", "text"]).optional(),
  sort: z
    .enum(["relevance", "popular", "latest", "views", "rated"])
    .optional(),
});

/** GET /api/saved-searches — list the user's saved alerts. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  const items = await listSavedSearchesForUser(user.id);
  return NextResponse.json({ items }, { headers: NO_STORE });
}

/** POST /api/saved-searches — create a new alert from current filters. */
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
    const saved = await createSavedSearch(user, parsed.data);
    return NextResponse.json({ saved }, { status: 201, headers: NO_STORE });
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
