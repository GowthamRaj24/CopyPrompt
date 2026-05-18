import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import {
  getCollectionsForPrompt,
  listMyCollections,
} from "@/server/services/collection.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

interface Context {
  params: Promise<{ promptId: string }>;
}

/**
 * GET /api/collections/membership/[promptId]
 *
 * Returns the user's collections and which ones already contain this
 * prompt. Used by the SaveToCollectionButton picker to draw checkmarks.
 *
 * Unauthenticated → 200 with empty payload to keep the picker silent.
 */
export async function GET(_req: NextRequest, ctx: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { collections: [], memberOf: [] },
      { headers: NO_STORE },
    );
  }

  const { promptId } = await ctx.params;
  const [collections, memberOfSet] = await Promise.all([
    listMyCollections(user.id),
    getCollectionsForPrompt(user.id, promptId),
  ]);

  return NextResponse.json(
    {
      collections,
      memberOf: Array.from(memberOfSet),
    },
    { headers: NO_STORE },
  );
}
