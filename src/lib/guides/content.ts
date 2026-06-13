export interface GuideArticle {
  slug: string;
  title: string;
  description: string;
  readTimeMinutes: number;
  publishedAt: string;
  /** Markdown body */
  body: string;
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "chatgpt-prompt-engineering",
    title: "ChatGPT prompt engineering: a practical guide",
    description:
      "Learn the role-task-format pattern, placeholder tokens, and guardrails that make ChatGPT prompts reliable for writing, coding, and analysis.",
    readTimeMinutes: 8,
    publishedAt: "2026-06-01",
    body: `## Why structure beats length

Most ChatGPT failures are not model failures — they are instruction failures. A prompt that says "write a blog post about AI" forces the model to guess audience, tone, length, and structure. A prompt that opens with **You are a B2B SaaS editor**, defines **600 words**, **three H2 sections**, and **banned phrases** removes guesswork.

My Copyprompt templates follow this pattern because it survives model updates better than clever one-liners.

## The four-block template

Use four blocks in order:

1. **Role + objective** — "You are a senior technical editor. Your job is to…"
2. **Context** — paste facts, URLs, or bullet inputs the model must use
3. **Rules** — 4–7 dos and don'ts (cite sources, no hallucinated stats, markdown output)
4. **Output format** — headings, table, JSON schema, or word count

Example skeleton:

\`\`\`text
You are a customer success lead. Draft a renewal email for a B2B analytics account.

Context:
- Customer: {COMPANY}
- Usage trend: {METRIC}
- Renewal date: {DATE}

Rules:
- Lead with value delivered, not feature list
- One clear CTA for a 15-minute call
- Under 180 words
- No exclamation marks

Output: subject line + body in markdown
\`\`\`

## Placeholders

Curly-brace tokens like \`{COMPANY}\` tell humans what to swap without confusing the model. Replace every placeholder before sending; leaving \`{COMPANY}\` in place is the most common copy-paste mistake.

## Temperature and follow-ups

For factual or coding tasks, ask for **step-by-step reasoning** then **final answer only**. For creative drafts, request **two variants** (concise vs narrative) in one shot to avoid re-rolling.

## Common pitfalls

- **Stacking conflicting styles** ("be brief" + "be exhaustive")
- **Hidden constraints** buried in paragraph 3 — put rules in a list
- **No failure mode** — add "If data is missing, ask one clarifying question"

## Next steps

Browse [ChatGPT prompts on My Copyprompt](/models/chatgpt) for ready-made templates, or [submit](/submit) your own after you validate it twice in production.`,
  },
  {
    slug: "midjourney-prompt-structure",
    title: "Midjourney prompt structure that actually renders",
    description:
      "Subject, camera, lighting, and style tokens for Midjourney v6 — with examples you can copy into Discord /imagine.",
    readTimeMinutes: 9,
    publishedAt: "2026-06-02",
    body: `## Midjourney is not a paragraph generator

Midjourney parses **short, high-signal phrases** separated by commas or line breaks. Long narrative paragraphs dilute emphasis. Think: *subject → environment → lighting → camera → style reference*.

## Core anatomy

| Layer | Purpose | Example |
| --- | --- | --- |
| Subject | Who/what | "solo mountaineer, red jacket" |
| Scene | Where | "alpine ridge, pre-dawn fog" |
| Lighting | Mood | "soft rim light, cool shadows" |
| Camera | Lens feel | "35mm film still, shallow DOF" |
| Style | Aesthetic | "editorial outdoor, muted palette" |

## Parameters that matter

- **Aspect ratio** — \`--ar 16:9\` for banners, \`--ar 2:3\` for posters
- **Style raw** — when you want less default beautification
- **No** — use sparingly; describe what you want instead of long negative lists

## Reference images

When using \`--cref\` or style references, keep language consistent with the reference (wardrobe, palette). Change one variable at a time when iterating.

## Workflow on My Copyprompt

1. Open a [Midjourney prompt](/models/midjourney) with reference output
2. Copy the prompt block
3. Paste into Discord \`/imagine\`
4. Adjust \`--ar\` only if the curator note suggests a different crop

## Quality checks

Before publishing your own Midjourney prompt to the community:

- Include **at least one output image** you generated with the exact text
- Add a **curator note** explaining which words are load-bearing
- Mention **version-specific quirks** (v6 vs niji)

## Explore further

See [cinematic portrait prompts](/category/cinematic-portraits) or read our [Flux prompting guide](/guides/flux-image-prompting) for cross-model comparison.`,
  },
  {
    slug: "flux-image-prompting",
    title: "Flux image prompting: Dev, Schnell, and Pro",
    description:
      "How to write Flux-friendly prompts, tune guidance and steps, and when to switch between Dev, Schnell, and Pro.",
    readTimeMinutes: 7,
    publishedAt: "2026-06-03",
    body: `## Natural language first

Flux models (Dev, Schnell, Pro, Kontext) respond well to **descriptive prose** with explicit materials and lighting. Unlike older SD tag soups, write scenes as art direction notes.

## Model selection

- **Schnell** — layout exploration, storyboards, fast A/B
- **Dev** — default quality for most social and concept work
- **Pro** — hero assets, print-bound detail, client delivery
- **Kontext** — edit existing images while preserving subject identity

## Parameter hygiene

Document in your prompt or curator note:

- **Steps** — higher for fine texture; lower for drafts
- **Guidance** — too high causes waxiness; too low drifts from prompt
- **Aspect ratio** — set in UI or embed in workflow JSON

## Negative prompts

Flux often needs **short negatives** ("no watermark, no text overlay") rather than SD-style walls of exclusions.

## Building a reusable template

1. Lock composition language (camera height, subject placement)
2. Parameterize nouns (\`{PRODUCT_NAME}\`, \`{COLOR_PALETTE}\`)
3. Attach **proof images** from the exact settings you document

## Library starting points

Browse [Flux Dev](/models/flux-dev), [Flux Schnell](/models/flux-schnell), and [Flux Pro](/models/flux-pro) collections on My Copyprompt — each listing includes parameters where curators tested them.

## Submitting Flux prompts

When you [submit](/submit) an image prompt, upload real outputs (HTTPS URLs). Placeholder stock images delay approval and hurt site quality standards.`,
  },
  {
    slug: "claude-prompt-best-practices",
    title: "Claude prompt best practices for long documents",
    description:
      "System-style prefaces, XML sections, and citation rules that make Claude Sonnet and Opus outputs consistent.",
    readTimeMinutes: 7,
    publishedAt: "2026-06-04",
    body: `## Claude prefers explicit structure

Anthropic models follow **delimiters** reliably. Wrap inputs and outputs:

\`\`\`xml
<document>{PASTE_SOURCE}</document>

<task>Summarize risks for an executive audience</task>

<format>
- 5 bullets max
- Each bullet: risk → impact → mitigation
</format>
\`\`\`

## Sonnet vs Opus

- **Sonnet** — daily writing, code review, fast iteration
- **Opus** — multi-step research, adversarial review, complex planning

Use Opus templates only when latency and cost are acceptable; many Sonnet prompts upgrade cleanly by adding "think step-by-step internally, output final only."

## Document-grounded tasks

When citing uploaded PDFs or pasted text:

- Tell Claude **what to do if the answer is not in the document**
- Request **quoted spans** or paragraph references
- Forbid inventing statistics

## Safety and tone

Claude responds well to **tone matrices** ("confident but not salesy"). Avoid asking for disallowed content; reframe red-team tasks as defensive security reviews with scope limits.

## Templates on My Copyprompt

Explore [Claude Sonnet](/models/claude-sonnet) and [Claude Opus](/models/claude-opus) prompts — each includes sample output so you can compare depth before running.

## Contribute back

If you maintain Claude prompts for legal review, product specs, or education, [submit them publicly](/submit) with a curator note describing attachment size limits that worked for you.`,
  },
  {
    slug: "image-vs-text-prompts",
    title: "Image prompts vs text prompts: choose the right tool",
    description:
      "When to use Midjourney/Flux versus ChatGPT/Claude, and how My Copyprompt organizes both types.",
    readTimeMinutes: 6,
    publishedAt: "2026-06-05",
    body: `## Two different animals

**Text prompts** instruct language models to produce words: emails, code, analysis, plans.

**Image prompts** instruct diffusion models to produce pixels: characters, products, scenes.

Copying an image prompt into ChatGPT will **describe** an image, not render one. Copying a chat prompt into Midjourney will ignore most formatting.

## How My Copyprompt separates them

- **Browse → Image / Text** filters the catalog by model type
- **Model pages** ([/models](/models)) group prompts by target tool
- **Categories** map to use cases (marketing, portraits, coding)

Always check the model badge on a prompt page before copying.

## Proof expectations

| Type | Proof on My Copyprompt |
| --- | --- |
| Image | Reference renders (1–3 images) |
| Text | Sample output panel showing real model response |

Submissions without proof are unlikely to be approved.

## Picking a workflow

1. Define deliverable (PNG vs markdown doc)
2. Pick model family
3. Filter library by model or category
4. Copy prompt + read curator note
5. Iterate locally, then remix or submit improvements

## Deep dives

- [ChatGPT prompt engineering](/guides/chatgpt-prompt-engineering)
- [Midjourney structure](/guides/midjourney-prompt-structure)
- [Flux prompting](/guides/flux-image-prompting)`,
  },
  {
    slug: "how-to-use-copyprompt",
    title: "How to use My Copyprompt effectively",
    description:
      "Search, collections, favorites, remix, and submission — a complete tour of the platform beyond copy-paste.",
    readTimeMinutes: 6,
    publishedAt: "2026-06-06",
    body: `## What My Copyprompt is

My Copyprompt is a **curated prompt library**, not a model host. We do not run ChatGPT or Midjourney for you — we store battle-tested prompts, usage notes, and proof so you can copy them into your own tools in one click.

## Find prompts

- **Search** — keyword + semantic relevance
- **Categories** — use-case taxonomies (coding, portraits, marketing)
- **Models** — filter by target AI tool
- **Tags** — cross-cutting topics (#logo, #cyberpunk)
- **Collections** — themed boards curated by editors or users

## Use a prompt

1. Open a prompt page
2. Read the curator note and FAQ
3. Click **Copy**
4. Paste into your AI tool
5. Replace \`{placeholders}\`

No account required for browsing or copying.

## Save and organize (account)

- **Favorites** — heart prompts for quick access
- **Collections** — private or public boards (share at \`/c/your-slug\`)
- **Copy history** — recent prompts you copied (signed-in users)

## Remix and submit

- **Remix** forks a public prompt with attribution to the original author
- **Submit** sends prompts through human review (~24 hours)
- Public submissions need **proof** (images or sample output) and a **curator note**

## Generate new prompts

Signed-in users can use [/generate](/generate) to draft prompts with Gemini, then edit before submitting.

## Quality bar

We review submissions for clarity, proof, and originality. Low-effort duplicates or prompts without guidance are rejected — this keeps the library useful for everyone and maintains publisher quality standards.

## Help and contact

Read [About](/about) for the full feature list or email [hello@mycopyprompt.in](/contact) with questions.`,
  },
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((g) => g.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return GUIDE_ARTICLES.map((g) => g.slug);
}
