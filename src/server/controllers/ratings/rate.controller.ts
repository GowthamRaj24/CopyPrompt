import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import { getUserRating, ratePrompt } from "@/server/services/rating.service";

const bodySchema = z.object({
  rating: z.union([z.literal(1), z.literal(-1)]),
});

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/prompts/[id]/rate
 * Body: { rating: 1 | -1 }
 *
 * Auth required. Idempotent: clicking the same rating twice is a no-op.
 * Clicking the opposite rating flips the vote.
 */
export async function rateController(
  req: Request,
  context: Context,
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: promptId } = await context.params;
  if (!promptId || !isValidUuid(promptId)) {
    return NextResponse.json(
      { error: "Invalid prompt id" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const result = await ratePrompt(user.id, promptId, parsed.data.rating);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[rate] failed", err);
    return NextResponse.json(
      { error: "Could not record rating. Try again." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/prompts/[id]/rate
 *
 * Returns the current user's rating for the prompt (or null if not
 * rated, or 401-equivalent `{ rating: null }` when signed-out). Lets
 * the client hydrate `ActionsBar` without forcing the parent page
 * into `force-dynamic` rendering.
 */
export async function getRatingController(
  _req: Request,
  context: Context,
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { rating: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id: promptId } = await context.params;
  if (!promptId || !isValidUuid(promptId)) {
    return NextResponse.json(
      { error: "Invalid prompt id" },
      { status: 400 },
    );
  }

  const rating = await getUserRating(user.id, promptId);
  return NextResponse.json(
    { rating },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}
