import { z } from "zod";

/**
 * Validators for admin moderation actions.
 */

export const rejectSubmissionSchema = z.object({
  reason: z
    .string()
    .min(1, "Rejection reason is required")
    .max(500, "Rejection reason too long")
    .trim(),
});

export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>;
