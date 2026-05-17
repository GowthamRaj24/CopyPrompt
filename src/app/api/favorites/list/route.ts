import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import { getUserFavoritesPage } from "@/server/services/favorite.service";

/**
 * GET /api/favorites/list?page=2 — paginated favorites for "Load more".
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const page = Math.max(
    1,
    Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) ||
      1,
  );

  const data = await getUserFavoritesPage(user.id, page);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
