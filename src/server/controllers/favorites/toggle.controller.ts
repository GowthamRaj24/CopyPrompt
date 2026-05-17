import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import {
  addFavorite,
  getAllUserFavoriteIds,
  isFavorited,
  removeFavorite,
} from "@/server/services/favorite.service";

/**
 * POST  /api/favorites/[promptId] → add to favorites
 * DELETE /api/favorites/[promptId] → remove from favorites
 * GET   /api/favorites/[promptId] → { favorited: boolean }
 */

interface Context {
  params: Promise<{ promptId: string }>;
}

export async function addFavoriteController(
  _req: NextRequest,
  context: Context,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { promptId } = await context.params;
  if (!promptId) {
    return NextResponse.json({ error: "Missing promptId" }, { status: 400 });
  }
  await addFavorite(user.id, promptId);
  return NextResponse.json({ favorited: true });
}

export async function removeFavoriteController(
  _req: NextRequest,
  context: Context,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { promptId } = await context.params;
  if (!promptId) {
    return NextResponse.json({ error: "Missing promptId" }, { status: 400 });
  }
  await removeFavorite(user.id, promptId);
  return NextResponse.json({ favorited: false });
}

export async function checkFavoriteController(
  _req: NextRequest,
  context: Context,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ favorited: false });
  }
  const { promptId } = await context.params;
  if (!promptId) {
    return NextResponse.json({ error: "Missing promptId" }, { status: 400 });
  }
  const favorited = await isFavorited(user.id, promptId);
  return NextResponse.json({ favorited });
}

/**
 * GET /api/favorites/me
 *
 * Returns the full set of prompt IDs the current user has favorited.
 * Unauthenticated → returns { ids: [] } silently (no 401 noise).
 *
 * Browser caches via Cache-Control: this endpoint is intentionally
 * `no-store` so a fresh sign-in always gets fresh hearts, but the
 * `FavoritesProvider` in-memory cache keeps it to ONE fetch per tab.
 */
export async function listMyFavoritesController(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ids: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  const ids = await getAllUserFavoriteIds(user.id);
  return NextResponse.json(
    { ids },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
