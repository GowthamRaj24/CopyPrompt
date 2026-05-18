/**
 * Contributor badges.
 *
 * Pure function over a user's denormalized stats — no DB, no UI deps.
 * Render with the helper in `BadgeChip` (or any equivalent component).
 *
 * Tiers are intentionally conservative: easy entry ("First prompt"),
 * meaningful milestones (10/25/100 prompts; 100/1k/10k copies), no
 * pay-to-win or daily-streak gimmicks.
 */

export interface ContributorBadge {
  id: string;
  label: string;
  /** Short tooltip describing the achievement. */
  hint: string;
  /** Used by the chip styling — "outline" for early tiers, "primary" for elite. */
  tone: "outline" | "primary" | "gold";
}

export interface ContributorBadgeInput {
  promptCount: number;
  totalCopies: number;
  /** Optional 1-based rank on the leaderboard for "Top contributor" badge. */
  rank?: number | null;
}

const PROMPT_TIERS: Array<{ at: number; label: string; tone: ContributorBadge["tone"] }> = [
  { at: 1, label: "First prompt", tone: "outline" },
  { at: 10, label: "Prolific", tone: "outline" },
  { at: 25, label: "Trusted contributor", tone: "primary" },
  { at: 100, label: "Catalog cornerstone", tone: "gold" },
];

const COPY_TIERS: Array<{ at: number; label: string; tone: ContributorBadge["tone"] }> = [
  { at: 100, label: "100 copies", tone: "outline" },
  { at: 1_000, label: "1k copies", tone: "primary" },
  { at: 10_000, label: "10k copies", tone: "gold" },
  { at: 100_000, label: "100k copies", tone: "gold" },
];

function highestTier<T extends { at: number }>(
  tiers: T[],
  value: number,
): T | null {
  let match: T | null = null;
  for (const t of tiers) {
    if (value >= t.at) match = t;
  }
  return match;
}

export function getContributorBadges(
  input: ContributorBadgeInput,
): ContributorBadge[] {
  const badges: ContributorBadge[] = [];

  const promptTier = highestTier(PROMPT_TIERS, input.promptCount);
  if (promptTier) {
    badges.push({
      id: `prompts-${promptTier.at}`,
      label: promptTier.label,
      hint: `${input.promptCount.toLocaleString()} approved ${
        input.promptCount === 1 ? "prompt" : "prompts"
      } in the public catalog`,
      tone: promptTier.tone,
    });
  }

  const copyTier = highestTier(COPY_TIERS, input.totalCopies);
  if (copyTier) {
    badges.push({
      id: `copies-${copyTier.at}`,
      label: copyTier.label,
      hint: `${input.totalCopies.toLocaleString()} copies across all prompts`,
      tone: copyTier.tone,
    });
  }

  if (input.rank && input.rank <= 10) {
    badges.push({
      id: "top-10",
      label: `Top ${input.rank <= 3 ? "3" : "10"} contributor`,
      hint: `Currently ranked #${input.rank} on the leaderboard`,
      tone: "gold",
    });
  }

  return badges;
}
