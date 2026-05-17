import {
  addFavoriteController,
  checkFavoriteController,
  removeFavoriteController,
} from "@/server/controllers/favorites/toggle.controller";

export const GET = checkFavoriteController;
export const POST = addFavoriteController;
export const DELETE = removeFavoriteController;
