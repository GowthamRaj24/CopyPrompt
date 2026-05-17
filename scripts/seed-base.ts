/**
 * Seed script: populate models + categories so the app has something to query.
 *
 * Run with:
 *   npx tsx scripts/seed-base.ts
 *
 * Idempotent — safe to re-run; uses ON CONFLICT DO NOTHING.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "../src/server/models/category.model";
import { models } from "../src/server/models/model.model";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client);

const MODELS_TO_SEED = [
  // ── Image models ────────────────────────────────────────────
  { slug: "flux-dev", name: "Flux Dev", type: "image" as const },
  { slug: "flux-schnell", name: "Flux Schnell", type: "image" as const },
  { slug: "flux-pro", name: "Flux Pro", type: "image" as const },
  { slug: "flux-kontext", name: "Flux Kontext", type: "image" as const },
  { slug: "midjourney", name: "Midjourney", type: "image" as const },
  { slug: "stable-diffusion-xl", name: "Stable Diffusion XL", type: "image" as const },
  { slug: "stable-diffusion-3", name: "Stable Diffusion 3", type: "image" as const },
  { slug: "dall-e-3", name: "DALL-E 3", type: "image" as const },
  { slug: "ideogram", name: "Ideogram", type: "image" as const },
  { slug: "leonardo-ai", name: "Leonardo AI", type: "image" as const },
  { slug: "adobe-firefly", name: "Adobe Firefly", type: "image" as const },
  { slug: "imagen", name: "Google Imagen", type: "image" as const },
  { slug: "recraft", name: "Recraft", type: "image" as const },

  // ── Text models ─────────────────────────────────────────────
  { slug: "chatgpt", name: "ChatGPT (GPT-4o)", type: "text" as const },
  { slug: "chatgpt-5", name: "ChatGPT 5", type: "text" as const },
  { slug: "claude-sonnet", name: "Claude Sonnet", type: "text" as const },
  { slug: "claude-opus", name: "Claude Opus", type: "text" as const },
  { slug: "gemini", name: "Google Gemini", type: "text" as const },
  { slug: "grok", name: "Grok (xAI)", type: "text" as const },
  { slug: "deepseek", name: "DeepSeek", type: "text" as const },
  { slug: "llama", name: "Meta Llama", type: "text" as const },
  { slug: "mistral", name: "Mistral", type: "text" as const },
  { slug: "perplexity", name: "Perplexity", type: "text" as const },
  { slug: "copilot", name: "Microsoft Copilot", type: "text" as const },
  { slug: "pi", name: "Pi", type: "text" as const },
  { slug: "any-llm", name: "Any LLM / Other", type: "text" as const },
];

const CATEGORIES_TO_SEED = [
  // ── Image categories ────────────────────────────────────────
  { slug: "image-generation", name: "Image Generation", description: "All AI image prompts" },
  { slug: "cinematic-portraits", name: "Cinematic Portraits", description: "Moody, film-like character portraits" },
  { slug: "product-photography", name: "Product Photography", description: "E-commerce and product shot prompts" },
  { slug: "logo-design", name: "Logo Design", description: "Brand identity and logo prompts" },
  { slug: "anime-illustration", name: "Anime & Illustration", description: "Anime, manga, and stylized illustrations" },
  { slug: "fantasy-characters", name: "Fantasy Characters", description: "Wizards, elves, mythical beings" },
  { slug: "architecture", name: "Architecture", description: "Buildings, interiors, urban landscapes" },
  { slug: "abstract-art", name: "Abstract Art", description: "Conceptual and surreal imagery" },

  // ── Text categories ─────────────────────────────────────────
  { slug: "validation-strategy", name: "Validation & Strategy", description: "Validate ideas, SWOT analysis, pitch reviews" },
  { slug: "coding-development", name: "Coding & Development", description: "Code review, debugging, refactoring, architecture" },
  { slug: "writing-content", name: "Writing & Content", description: "Blog posts, emails, social media, copywriting" },
  { slug: "marketing-sales", name: "Marketing & Sales", description: "Ad copy, landing pages, cold emails, pitch decks" },
  { slug: "analysis-research", name: "Analysis & Research", description: "Summarize, compare, decision matrices, research" },
  { slug: "productivity", name: "Productivity", description: "Meeting notes, task breakdown, decision making" },
  { slug: "learning-education", name: "Learning & Education", description: "Explain like I'm 5, study plans, quizzes" },
  { slug: "personal-career", name: "Personal & Career", description: "Resume, cover letter, interview prep, networking" },
];

async function main() {
  console.log("Seeding models...");
  for (const m of MODELS_TO_SEED) {
    await db.insert(models).values(m).onConflictDoNothing();
  }

  console.log("Seeding categories...");
  for (const c of CATEGORIES_TO_SEED) {
    await db.insert(categories).values(c).onConflictDoNothing();
  }

  const modelCount = await db.select().from(models);
  const categoryCount = await db.select().from(categories);

  console.log(`Done. Models in DB: ${modelCount.length}, Categories: ${categoryCount.length}`);

  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
