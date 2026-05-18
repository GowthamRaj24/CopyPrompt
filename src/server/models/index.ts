/**
 * Re-exports for all Drizzle schemas.
 *
 * Drizzle-kit reads this file to discover tables for migrations.
 * Application code can `import * as schema from "@/server/models"` to get them all.
 */
export * from "./model.model";
export * from "./category.model";
export * from "./tag.model";
export * from "./user.model";
export * from "./prompt.model";
export * from "./image.model";
export * from "./prompt-tag.model";
export * from "./favorite.model";
export * from "./collection.model";
export * from "./collection-prompt.model";
export * from "./submission.model";
export * from "./prompt-rating.model";
export * from "./prompt-copy.model";
export * from "./saved-search.model";
