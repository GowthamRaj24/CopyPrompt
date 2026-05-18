import { type NextRequest, NextResponse } from "next/server";
import {
  getCreatorByHandle,
  listCreatorPrompts,
} from "@/server/services/creator.service";

interface Context {
  params: Promise<{ handle: string }>;
}

/**
 * GET /api/u/[handle]/prompts?page=2
 *
 * Paginated published prompts for the public creator profile. Powers
 * the "Load more" button on `/u/[handle]`.
 */
export async function GET(req: NextRequest, ctx: Context) {
  const { handle } = await ctx.params;
  const creator = await getCreatorByHandle(handle);
  if (!creator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = Math.max(
    1,
    Number.parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1,
  );

  const data = await listCreatorPrompts(creator.id, page);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
