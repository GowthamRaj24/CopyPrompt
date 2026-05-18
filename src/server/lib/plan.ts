/**
 * Plan limits + helpers.
 *
 * Single source of truth for what each plan tier can do.
 * When Tier 3 (Premium) ships, only these constants change — services and
 * UI use the helpers below so we never get stale limit checks scattered
 * across the codebase.
 */

import type { AppUser } from "@/server/lib/auth";

export type PlanTier = "free" | "premium" | "admin";

interface PlanCaps {
  /** Max collections a user can own. */
  maxCollections: number;
  /** Max prompts per single collection. */
  maxPromptsPerCollection: number;
  /** Max active saved searches with email alerts. */
  maxSavedSearches: number;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLAN_LIMITS: Record<PlanTier, PlanCaps> = {
  free: {
    maxCollections: 5,
    maxPromptsPerCollection: 50,
    maxSavedSearches: 10,
  },
  premium: {
    maxCollections: UNLIMITED,
    maxPromptsPerCollection: UNLIMITED,
    maxSavedSearches: UNLIMITED,
  },
  admin: {
    maxCollections: UNLIMITED,
    maxPromptsPerCollection: UNLIMITED,
    maxSavedSearches: UNLIMITED,
  },
};

export function getPlanLimits(user: Pick<AppUser, "plan">): PlanCaps {
  return PLAN_LIMITS[user.plan as PlanTier] ?? PLAN_LIMITS.free;
}

export type PlanLimitCode =
  | "max_collections"
  | "max_prompts_per_collection"
  | "max_saved_searches";

export class PlanLimitError extends Error {
  code: PlanLimitCode;
  /** Upgrade target — useful for upsell modal copy. */
  upgradeTo: "premium";

  constructor(code: PlanLimitCode, message: string) {
    super(message);
    this.name = "PlanLimitError";
    this.code = code;
    this.upgradeTo = "premium";
  }
}

/**
 * Throws PlanLimitError if the user is at or above their collection cap.
 */
export function assertCanCreateCollection(
  user: Pick<AppUser, "plan">,
  currentCount: number,
): void {
  const limit = getPlanLimits(user).maxCollections;
  if (currentCount >= limit) {
    throw new PlanLimitError(
      "max_collections",
      `Free plan is limited to ${limit} collections. Upgrade for unlimited.`,
    );
  }
}

/**
 * Throws PlanLimitError if the collection is full for this user's plan.
 */
export function assertCanAddPromptToCollection(
  user: Pick<AppUser, "plan">,
  currentMembers: number,
): void {
  const limit = getPlanLimits(user).maxPromptsPerCollection;
  if (currentMembers >= limit) {
    throw new PlanLimitError(
      "max_prompts_per_collection",
      `Free plan is limited to ${limit} prompts per collection. Upgrade for unlimited.`,
    );
  }
}

/** Throws PlanLimitError if the user is at or above the saved-search cap. */
export function assertCanCreateSavedSearch(
  user: Pick<AppUser, "plan">,
  currentCount: number,
): void {
  const limit = getPlanLimits(user).maxSavedSearches;
  if (currentCount >= limit) {
    throw new PlanLimitError(
      "max_saved_searches",
      `Free plan is limited to ${limit} saved searches. Upgrade for unlimited.`,
    );
  }
}
