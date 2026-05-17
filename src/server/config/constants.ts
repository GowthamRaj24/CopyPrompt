/**
 * App-wide constants. Centralized so they're easy to tune.
 */

export const APP = {
  NAME: "mycopyprompt",
  TAGLINE: "Find the perfect Flux prompt in seconds.",
  DEFAULT_PAGE_SIZE: 24,
  MAX_PAGE_SIZE: 60,
} as const;

export const PROMPT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  HIDDEN: "hidden",
} as const;

export const SUBMISSION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const USER_PLAN = {
  FREE: "free",
  PREMIUM: "premium",
  ADMIN: "admin",
} as const;

export const MODEL_TYPE = {
  IMAGE: "image",
  TEXT: "text",
} as const;

export const IMAGE_LIMITS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  MIN_DIMENSION: 512,
  MAX_DIMENSION: 4096,
  ALLOWED_MIME: ["image/jpeg", "image/png", "image/webp"] as const,
  MAX_PER_PROMPT: 3,
};

export const RATE_LIMITS = {
  ANON_SUBMIT_PER_DAY: 5,
  USER_SUBMIT_PER_DAY: 20,
  UPLOAD_PER_MINUTE: 5,
};

export const PRICING = {
  PREMIUM_MONTHLY_INR: 399,
  PREMIUM_YEARLY_INR: 3999,
} as const;
