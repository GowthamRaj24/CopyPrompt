import { listMyFavoritesController } from "@/server/controllers/favorites/toggle.controller";

/**
 * GET /api/favorites/me
 *
 * Returns { ids: string[] } — the prompts the current user has favorited.
 * Powers the client-side `FavoritesProvider` so the entire app hydrates
 * heart state with a single request per browser tab instead of one
 * request per card.
 */
export const GET = listMyFavoritesController;
