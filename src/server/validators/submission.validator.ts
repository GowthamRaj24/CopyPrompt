import { z } from "zod";

/**
 * Validation for prompt submissions.
 *
 * Both shared fields (title, prompt text, model, category) and
 * type-specific fields (image vs text) are validated here.
 *
 * Used by both the API controller (server-side) and the form (client-side)
 * via `@hookform/resolvers/zod`.
 */

const httpsUrl = z
  .string()
  .url("Must be a valid URL")
  .refine((u) => u.startsWith("https://"), {
    message: "URL must start with https://",
  });

const tagSlugSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9-]+$/, "Tags can only contain lowercase letters, numbers, and hyphens");

/** Common fields between image and text submissions */
const baseSchema = {
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(80, "Title must be 80 characters or less")
    .trim(),
  promptText: z
    .string()
    .min(20, "Prompt must be at least 20 characters")
    .max(5000, "Prompt must be 5000 characters or less")
    .trim(),
  modelSlug: z.string().min(1, "Pick a model"),
  categorySlug: z.string().min(1, "Pick a category"),
  tags: z
    .array(tagSlugSchema)
    .max(5, "Maximum 5 tags")
    .optional()
    .default([]),
  tips: z.string().max(1000, "Tips too long").optional(),
};

/** Image-specific submission */
export const imageSubmissionSchema = z.object({
  ...baseSchema,
  type: z.literal("image"),
  negativePrompt: z.string().max(2000).optional(),
  imageUrls: z
    .array(httpsUrl)
    .min(1, "Add at least one image URL")
    .max(3, "Maximum 3 images"),
  aspectRatio: z.string().max(20).optional(),
  steps: z.coerce
    .number()
    .int()
    .min(1)
    .max(150)
    .optional(),
  guidance: z.coerce.number().min(0).max(20).optional(),
  seed: z.coerce.number().int().optional(),
});

/** Text-specific submission */
export const textSubmissionSchema = z.object({
  ...baseSchema,
  type: z.literal("text"),
  expectedOutcome: z
    .string()
    .min(20, "Add a sample output (helps users see the value)")
    .max(5000, "Sample output too long"),
  temperature: z.coerce.number().min(0).max(2).optional(),
  maxTokens: z.coerce.number().int().min(1).max(10000).optional(),
  systemMessage: z.string().max(2000).optional(),
});

/** The full discriminated union — validates either an image OR text submission */
export const submissionSchema = z.discriminatedUnion("type", [
  imageSubmissionSchema,
  textSubmissionSchema,
]);

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type ImageSubmissionInput = z.infer<typeof imageSubmissionSchema>;
export type TextSubmissionInput = z.infer<typeof textSubmissionSchema>;

/**
 * The full wire schema for `POST /api/submit`. The captcha token is
 * stripped before the service layer sees it — services only deal with
 * sanitized prompt data, never auth/anti-abuse tokens.
 */
export const submissionWireSchema = z.intersection(
  submissionSchema,
  z.object({
    captchaToken: z.string().max(2048).nullable().optional(),
  }),
);
export type SubmissionWireInput = z.infer<typeof submissionWireSchema>;

/**
 * Convert any user input into a valid tag slug.
 * Used by the TagInput component before adding a chip.
 */
export function slugifyTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}
