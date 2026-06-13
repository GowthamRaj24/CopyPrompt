/**
 * Unique editorial intros for taxonomy pages.
 * Each slug gets hand-written prose (not keyword stuffing) so listing
 * pages carry real informational value beyond the prompt grid.
 */

const CATEGORY_EDITORIAL: Record<string, string[]> = {
  "image-generation": [
    "Image generation prompts are the blueprint for tools like Midjourney, Flux, DALL-E, and Stable Diffusion. A strong prompt describes subject, lighting, lens, composition, and mood — not just a one-line idea. This category collects production-ready templates across styles so you can copy, tweak placeholders, and iterate faster.",
    "Browse by popularity to see what the community copies most, or switch to Latest for newly reviewed additions. Every prompt includes the full text plus curator notes on parameters that matter (aspect ratio, steps, guidance). Pair these with our Midjourney and Flux guides if you are learning prompt structure from scratch.",
  ],
  "cinematic-portraits": [
    "Cinematic portrait prompts aim for film-grade lighting, shallow depth of field, and emotionally grounded subjects — think neon rain, golden-hour warmth, or noir contrast. They work best when you specify camera language (35mm, anamorphic, grain) alongside wardrobe and expression.",
    "Use this collection when you need character art, editorial headshots, or mood boards that feel shot on set rather than generated from a generic description. Copy a base prompt, swap the subject and palette, then adjust aspect ratio for your target platform.",
  ],
  "product-photography": [
    "Product photography prompts focus on clean backgrounds, controlled reflections, and hero angles that e-commerce and brand teams expect. Good templates call out surface material, lighting setup (softbox, rim light), and negative space for copy overlays.",
    "Whether you are mocking up packaging, gadgets, or cosmetics, start from a proven prompt here rather than guessing adjectives. Curator notes often mention which models handle glass and metal highlights most reliably.",
  ],
  "logo-design": [
    "Logo prompts balance simplicity, scalability, and brand personality. Effective templates constrain color count, geometry (wordmark vs emblem), and background treatment so outputs stay usable as vector starting points.",
    "These prompts are tuned for flat, minimal marks — not full brand systems. Copy one, replace the brand name placeholder, and iterate in your preferred image model before refining in Illustrator or Figma.",
  ],
  "anime-illustration": [
    "Anime and illustration prompts specify line weight, cel shading, palette, and character proportions distinct from photorealistic styles. The best entries reference studio aesthetics (soft watercolor, sharp shonen, retro 90s) so the model commits to a coherent look.",
    "Ideal for character sheets, visual novel assets, and fan art bases. Combine tags like chibi or cyberpunk with category filters to narrow results quickly.",
  ],
  "fantasy-characters": [
    "Fantasy character prompts cover armor, magical effects, species details, and world-building cues that generic portrait prompts miss. Strong templates separate character description from environment so you can reuse the same hero across scenes.",
    "Use this category for RPG concepts, book covers, and game pitch art. Curator notes often flag which negative prompts reduce extra limbs or muddy armor details.",
  ],
  architecture: [
    "Architecture prompts describe building typology, materials, time of day, and human scale. They help image models render believable perspective, fenestration, and landscaping instead of surreal structures.",
    "Browse here for interior design mood boards, urban exteriors, and conceptual massing studies. Specify aspect ratio early — wide formats suit skyline shots; portrait suits atrium interiors.",
  ],
  "abstract-art": [
    "Abstract prompts trade literal subjects for color fields, texture, motion, and composition rules. They are useful for wallpapers, album art, and presentation backgrounds where representational accuracy matters less than mood.",
    "Start from a template that defines palette and energy (calm gradient vs chaotic splatter), then layer your own constraints. These pair well with Flux and SDXL models that respond to texture vocabulary.",
  ],
  "validation-strategy": [
    "Validation and strategy prompts help you stress-test ideas before you build. They structure SWOT analysis, ICP definition, pricing sensitivity, and competitive positioning so ChatGPT or Claude answer with frameworks instead of generic encouragement.",
    "Use these when pitching investors, prioritizing roadmap bets, or running premortems. Each prompt includes a sample output showing the depth you should expect — swap in your product context and iterate.",
  ],
  "coding-development": [
    "Coding prompts cover code review, debugging, refactoring, architecture decisions, and documentation. The strongest templates specify language, constraints (no new dependencies), and output format (diff vs full file) so the model stays actionable.",
    "Copy a prompt before opening a PR or when stuck on a bug — curator notes often mention temperature and whether the template assumes repo context. Pair with our ChatGPT prompt engineering guide for best results.",
  ],
  "writing-content": [
    "Writing prompts help you draft blogs, newsletters, social threads, and long-form content with consistent voice. Good templates define audience, tone, structure (hook → body → CTA), and banned phrases so output needs less editing.",
    "Browse by popularity to see formats the community reuses weekly. Replace bracketed placeholders with your topic, brand voice, and length target before sending.",
  ],
  "marketing-sales": [
    "Marketing prompts generate ad copy, landing page sections, cold emails, and pitch narratives grounded in benefits and objections. They work best when you feed real customer quotes or metrics into the placeholders.",
    "Use this category for launch campaigns, lifecycle emails, and sales enablement one-pagers. Sample outputs demonstrate the persuasion structure each template enforces.",
  ],
  "analysis-research": [
    "Analysis prompts structure comparisons, literature summaries, decision matrices, and research briefs. They constrain the model to cite assumptions, score options, and surface risks instead of producing vague summaries.",
    "Ideal for product research, vendor selection, and competitive teardowns. Copy the prompt, paste your source material, and ask the model to follow the embedded rubric.",
  ],
  productivity: [
    "Productivity prompts turn messy inputs into meeting notes, task breakdowns, decision logs, and weekly plans. Templates often include role assignment, due dates, and explicit next steps so output is executable.",
    "Reach for these after calls or when planning sprints. Curator notes flag which models handle long context best for transcript-heavy workflows.",
  ],
  "learning-education": [
    "Learning prompts explain complex topics at adjustable levels, build study plans, generate quizzes, and create spaced-repetition cards. They specify audience age, prior knowledge, and output format (analogy-heavy vs exam-focused).",
    "Teachers, students, and self-learners use this category to turn textbooks or lectures into active study material. Start with a popular template and tune difficulty in the placeholders.",
  ],
  "personal-career": [
    "Career prompts cover resumes, cover letters, interview prep, networking messages, and negotiation scripts. Strong templates ask for your achievements in STAR format so the model quantifies impact.",
    "Use before applying or interviewing — sample outputs show the tone and structure recruiters expect. Avoid submitting PII in public submissions; run these privately in your chat tool.",
  ],
};

const MODEL_EDITORIAL: Record<string, string[]> = {
  midjourney: [
    "Midjourney prompts on My Copyprompt are written for Discord-based generation: concise subject lines, explicit aspect ratios, and style tokens that survive v6 parsing. Copy a template, paste into /imagine, and adjust --ar or --style only when the curator note suggests it.",
    "Reference images in each listing show what the exact prompt produced — not stock placeholders. When remixing, keep lighting and lens language intact; swap nouns and color palettes first before rewriting structure.",
  ],
  "flux-dev": [
    "Flux Dev prompts emphasize natural language descriptions with optional JSON-style parameter blocks for steps, guidance, and seed. This collection favors balanced quality/speed settings suitable for iteration.",
    "Flux reads comma-separated descriptors well but rewards explicit material and lighting vocabulary. Use curator notes to see recommended guidance ranges before batching variations.",
  ],
  "flux-schnell": [
    "Flux Schnell prompts prioritize fast drafts and preview frames. Templates here use shorter descriptions and lower step counts — perfect for layout exploration before moving to Flux Dev or Pro for final renders.",
    "Copy a Schnell prompt when latency matters more than micro-detail. Scale up steps in your local UI only after composition is locked.",
  ],
  "flux-pro": [
    "Flux Pro prompts target maximum fidelity: longer descriptions, precise camera specs, and tighter negative prompts. Browse here for hero marketing assets and portfolio pieces where artifact reduction matters.",
    "Curator notes often compare Pro vs Dev settings on the same subject so you can decide when the extra compute is worth it.",
  ],
  "flux-kontext": [
    "Flux Kontext prompts support image+text conditioning workflows. Templates explain what to keep constant across edits (pose, product) versus what to change (background, season).",
    "Use this category when you need iterative edits without re-rolling entire scenes from scratch.",
  ],
  chatgpt: [
    "ChatGPT prompts here assume GPT-4o-class models: role-first instructions, explicit output schemas, and guardrails against hallucination. Copy into a new chat, fill placeholders, and pin the prompt as a custom instruction if you reuse it weekly.",
    "Text prompts include sample outputs so you can preview structure before running. For coding or analysis tasks, paste supporting context below the prompt block.",
  ],
  "chatgpt-5": [
    "ChatGPT 5 prompts push longer reasoning chains and multi-step deliverables. Templates specify when to show work, when to ask clarifying questions, and how to format final answers for stakeholders.",
    "Use these for research synthesis, complex planning, and agent-style tasks where earlier GPT versions might truncate detail.",
  ],
  "claude-sonnet": [
    "Claude Sonnet prompts lean on clear system-style prefaces and document-grounded tasks. They often request XML or markdown sections Claude formats reliably.",
    "Copy a Sonnet template when you need fast, nuanced writing or code explanation. Curator notes mention context window usage for long attachments.",
  ],
  "claude-opus": [
    "Claude Opus prompts target maximum reasoning depth: multi-phase workflows, adversarial review passes, and structured debate between options.",
    "Reach for Opus templates on architecture decisions, legal-ish summaries (with human review), and novel problem decomposition.",
  ],
  gemini: [
    "Gemini prompts include multimodal hints where relevant and Google-ecosystem context (Docs, Sheets exports). Templates specify JSON or table output when integrating with automation.",
    "Ideal for fast brainstorming and mixed media tasks. Sample outputs show how Gemini formats lists versus prose.",
  ],
  "dall-e-3": [
    "DALL-E 3 prompts use conversational descriptions OpenAI rewrites internally — templates here stay declarative and avoid conflicting style cues. Specify aspect intent in plain language rather than SD-style weights.",
    "Browse for marketing visuals and conceptual illustrations where OpenAI safety filters apply; curator notes flag common refusal triggers to rephrase.",
  ],
  "stable-diffusion-xl": [
    "SDXL prompts may include weight syntax and LoRA-friendly trigger words. This collection notes base model assumptions and recommended samplers where curators tested them.",
    "Copy prompts into Automatic1111, ComfyUI, or hosted SDXL endpoints — adjust CFG and steps per the embedded parameter block.",
  ],
  "stable-diffusion-3": [
    "Stable Diffusion 3 prompts favor natural language over tag stacks. Templates describe scene graph relationships (foreground subject, midground, background) SD3 parses well.",
    "Use for typography-heavy scenes and improved human anatomy versus SDXL baselines.",
  ],
  grok: [
    "Grok prompts assume xAI chat with optional real-time context. Templates keep tone direct and specify when to cite current events versus timeless advice.",
    "Useful for social-first drafts and punchy summaries. Replace placeholder topics with your niche before posting.",
  ],
  deepseek: [
    "DeepSeek prompts emphasize reasoning-heavy coding and math tasks. Templates request step-by-step proofs and complexity notes.",
    "Copy when cost-efficient long context matters; verify critical code paths locally after generation.",
  ],
  llama: [
    "Meta Llama prompts use explicit formatting fences because open-weight models follow delimiter cues closely. Templates stay slightly shorter than Claude equivalents.",
    "Ideal for self-hosted or API deployments where you control system prompts and stop sequences.",
  ],
  mistral: [
    "Mistral prompts target European-language quality and concise instruction following. Templates avoid overly nested bullet hierarchies.",
    "Browse for bilingual content and efficient summarization workflows.",
  ],
  perplexity: [
    "Perplexity prompts request cited research briefs and comparison tables. They tell the model how many sources to prioritize and how to flag uncertainty.",
    "Use when you need answer-engine style output with explicit reference sections.",
  ],
  copilot: [
    "Microsoft Copilot prompts integrate Office workflows: pivot tables, slide outlines, and email threads. Templates specify Microsoft 365 context.",
    "Copy before drafting in Word or Excel copilot panes; paste source data immediately after the prompt.",
  ],
  pi: [
    "Pi prompts favor conversational coaching and reflective questions. Templates keep tone warm and iterative rather than dump-final-answer mode.",
    "Use for journaling prompts, habit planning, and lightweight tutoring.",
  ],
  ideogram: [
    "Ideogram prompts highlight typography and poster layouts where text-in-image quality matters. Templates separate headline copy from visual description.",
    "Essential for event graphics and merch mockups; specify font mood even if exact spelling is edited later in design tools.",
  ],
  "leonardo-ai": [
    "Leonardo AI prompts include platform-specific preset hints and Alchemy settings where curators tested them. Reference images demonstrate preset + prompt pairings.",
    "Browse for game assets and stylized illustration batches.",
  ],
  "adobe-firefly": [
    "Adobe Firefly prompts respect commercial-safe training constraints. Templates avoid branded characters and focus on stock-friendly compositions.",
    "Use when generating assets destined for Adobe Creative Cloud workflows.",
  ],
  imagen: [
    "Google Imagen prompts mirror Gemini image generation best practices: single-scene clarity, explicit lighting, and restrained attribute count.",
    "Copy for photorealistic scenes where Imagen 3 quality is available in your region.",
  ],
  recraft: [
    "Recraft prompts target vector-friendly illustration and brand-consistent iconography. Templates specify flat color limits and stroke weight.",
    "Ideal for UI illustration kits and editable SVG starting points.",
  ],
  "any-llm": [
    "Model-agnostic prompts avoid vendor-specific syntax so you can reuse them in ChatGPT, Claude, Gemini, or open models. They rely on universal patterns: role, task, constraints, output format.",
    "Start here when sharing prompts publicly or migrating between tools — tune temperature per your provider's docs.",
  ],
};

function categoryFallback(name: string, description: string | null): string[] {
  const blurb = description ?? `${name} prompts for major AI tools`;
  return [
    `This ${name.toLowerCase()} collection on My Copyprompt gathers free, copy-paste-ready templates reviewed before publication. ${blurb.charAt(0).toUpperCase()}${blurb.slice(1)}.`,
    "Each listing includes the full prompt, curator guidance, and proof of output where available. Sort by Popular to see community favorites or Latest for new additions. No account is required to copy — sign in only if you want to save favorites or submit your own.",
  ];
}

function modelFallback(
  name: string,
  type: "image" | "text",
  promptCount: number,
): string[] {
  const kind = type === "image" ? "image generation" : "chat and text";
  return [
    `These ${promptCount} prompts are built specifically for ${name} — ${kind} workflows tested by contributors and curators. Copy any template in one click and paste it directly into ${name}.`,
    "Popular sort surfaces prompts with the most copies and saves; Latest shows newly approved entries. Read curator notes before changing parameters — they often document temperature, aspect ratio, or safety rephrases that matter for this model.",
  ];
}

export function getCategoryEditorial(
  slug: string,
  name: string,
  description: string | null,
): string[] {
  return CATEGORY_EDITORIAL[slug] ?? categoryFallback(name, description);
}

export function getModelEditorial(
  slug: string,
  name: string,
  type: "image" | "text",
  promptCount: number,
): string[] {
  const specific = MODEL_EDITORIAL[slug];
  if (specific) return specific;
  return modelFallback(name, type, promptCount);
}

export function getTagEditorial(tagName: string, promptCount: number): string[] {
  const topic = tagName.toLowerCase();
  return [
    `This page collects ${promptCount} free AI prompts tagged #${tagName} — curated templates for ${topic}-related workflows across ChatGPT, Claude, Gemini, Midjourney, Flux, and other tools. Every entry ships with the full prompt text plus usage notes so you can evaluate fit before copying.`,
    `Tags group prompts by subject, technique, or aesthetic (#${tagName}) so you do not wade through unrelated results. Switch between Popular and Latest to balance community proof against fresh submissions. When a prompt works well, copy it once and adapt placeholders for your project — no signup required.`,
    `All public prompts pass human review. If you have a reliable ${topic} workflow, submit it with the #${tagName} tag so others can discover your template.`,
  ];
}

/** Minimum published prompts for a tag page to be indexable. */
export const MIN_TAG_PROMPTS_FOR_INDEX = 5;
