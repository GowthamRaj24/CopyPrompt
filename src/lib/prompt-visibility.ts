import { and, eq } from "drizzle-orm";
import { prompts } from "@/server/models/prompt.model";

export const PROMPT_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
} as const;

export type PromptVisibility =
  (typeof PROMPT_VISIBILITY)[keyof typeof PROMPT_VISIBILITY];

/** Published prompts visible in search, browse, and sitemap. */
export function publicPublishedWhere() {
  return and(
    eq(prompts.status, "published"),
    eq(prompts.visibility, PROMPT_VISIBILITY.PUBLIC),
  );
}
