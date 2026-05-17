/**
 * Seed script: insert 10 sample prompts with placeholder images.
 *
 * Idempotent — uses ON CONFLICT DO NOTHING on slug.
 *
 * Run with:  npx tsx scripts/seed-prompts.ts
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "../src/server/models/category.model";
import { images } from "../src/server/models/image.model";
import { models } from "../src/server/models/model.model";
import { prompts } from "../src/server/models/prompt.model";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client);

interface SeedPrompt {
  slug: string;
  title: string;
  promptText: string;
  tips?: string;
  modelSlug: string;
  categorySlug: string;
  imageSeeds: string[]; // Picsum seeds for placeholder images
  params?: Record<string, unknown>;
}

const SEED_PROMPTS: SeedPrompt[] = [
  {
    slug: "cinematic-cyberpunk-portrait",
    title: "Cinematic Cyberpunk Portrait",
    promptText:
      "moody neon-lit portrait of a cybernetic woman, rain-slick streets, blade runner aesthetic, 8k, hyperrealistic, dramatic side lighting",
    tips: "Use seed 12345 with aspect 1:1 for similar lighting.",
    modelSlug: "flux-dev",
    categorySlug: "cinematic-portraits",
    imageSeeds: ["cyberpunk1", "cyberpunk2"],
    params: { aspect_ratio: "1:1", steps: 30, guidance: 3.5, seed: 12345 },
  },
  {
    slug: "ethereal-forest-dawn",
    title: "Ethereal Forest at Dawn",
    promptText:
      "ethereal misty forest at dawn, golden sunbeams piercing through ancient trees, soft volumetric light, fantasy atmosphere, photorealistic",
    tips: "Try with --ar 16:9 for landscape.",
    modelSlug: "flux-dev",
    categorySlug: "fantasy-characters",
    imageSeeds: ["forest1"],
    params: { aspect_ratio: "16:9", steps: 28 },
  },
  {
    slug: "modern-minimalist-logo",
    title: "Modern Minimalist Logo",
    promptText:
      "minimalist geometric logo, abstract brand mark, vector style, monochromatic, high contrast, on white background, professional",
    modelSlug: "flux-pro",
    categorySlug: "logo-design",
    imageSeeds: ["logo1"],
  },
  {
    slug: "cosmic-astronaut-floating",
    title: "Cosmic Astronaut Floating",
    promptText:
      "astronaut floating in deep space surrounded by colorful nebula, helmet reflecting galaxies, surreal cosmic vibes, 8k detail",
    modelSlug: "flux-dev",
    categorySlug: "abstract-art",
    imageSeeds: ["space1", "space2"],
    params: { aspect_ratio: "1:1", guidance: 4.0 },
  },
  {
    slug: "anime-magical-girl",
    title: "Anime Magical Girl",
    promptText:
      "anime magical girl with flowing pink hair, casting a glowing spell, sakura petals falling, studio ghibli style, vibrant colors",
    modelSlug: "flux-schnell",
    categorySlug: "anime-illustration",
    imageSeeds: ["anime1"],
  },
  {
    slug: "luxury-watch-product-shot",
    title: "Luxury Watch Product Shot",
    promptText:
      "luxury wristwatch on minimalist dark wood surface, rim lighting, professional product photography, ultra sharp detail, advertising quality",
    tips: "Great for ecommerce listings. Use --ar 1:1.",
    modelSlug: "flux-pro",
    categorySlug: "product-photography",
    imageSeeds: ["watch1", "watch2"],
    params: { aspect_ratio: "1:1", steps: 35 },
  },
  {
    slug: "brutalist-architecture-photo",
    title: "Brutalist Architecture",
    promptText:
      "brutalist concrete architecture, dramatic geometric forms, golden hour shadows, architectural photography, monochrome aesthetic",
    modelSlug: "flux-dev",
    categorySlug: "architecture",
    imageSeeds: ["arch1"],
  },
  {
    slug: "fantasy-dragon-mountain",
    title: "Fantasy Dragon on Mountain Peak",
    promptText:
      "ancient dragon perched on misty mountain peak at sunset, scales shimmering with fire, epic fantasy painting style, highly detailed",
    modelSlug: "flux-dev",
    categorySlug: "fantasy-characters",
    imageSeeds: ["dragon1"],
    params: { aspect_ratio: "16:9" },
  },
  {
    slug: "golden-hour-beach-scene",
    title: "Golden Hour Beach Scene",
    promptText:
      "serene beach at golden hour, warm sunset light, soft waves, minimalist composition, dreamy atmosphere, film photography",
    modelSlug: "flux-schnell",
    categorySlug: "abstract-art",
    imageSeeds: ["beach1"],
  },
  {
    slug: "abstract-liquid-metal",
    title: "Abstract Liquid Metal",
    promptText:
      "abstract liquid chrome metal flowing, holographic reflections, futuristic 3D render, high gloss, motion blur",
    modelSlug: "flux-pro",
    categorySlug: "abstract-art",
    imageSeeds: ["abstract1"],
  },
];

async function main() {
  console.log("Seeding sample prompts...");

  // Look up model and category IDs by slug
  const allModels = await db.select().from(models);
  const allCategories = await db.select().from(categories);

  const modelBySlug = new Map(allModels.map((m) => [m.slug, m.id]));
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  let inserted = 0;

  for (const p of SEED_PROMPTS) {
    const modelId = modelBySlug.get(p.modelSlug);
    const categoryId = categoryBySlug.get(p.categorySlug);

    if (!modelId || !categoryId) {
      console.warn(
        `Skipping ${p.slug}: missing model "${p.modelSlug}" or category "${p.categorySlug}"`,
      );
      continue;
    }

    // Check if prompt already exists (idempotency)
    const existing = await db
      .select({ id: prompts.id })
      .from(prompts)
      .where(eq(prompts.slug, p.slug))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    // Insert prompt. Engagement counters (copy_count, view_count,
    // upvotes, downvotes) are intentionally NOT passed so the DB's
    // default of 0 applies. Real counters accumulate from real usage —
    // never fabricated to make the UI look populated.
    const [newPrompt] = await db
      .insert(prompts)
      .values({
        slug: p.slug,
        title: p.title,
        promptText: p.promptText,
        tips: p.tips,
        modelId,
        categoryId,
        params: p.params ?? {},
        status: "published",
      })
      .returning({ id: prompts.id });

    if (!newPrompt) continue;

    // Insert images (using picsum.photos for placeholders)
    for (let i = 0; i < p.imageSeeds.length; i++) {
      const seed = p.imageSeeds[i];
      await db.insert(images).values({
        promptId: newPrompt.id,
        r2Key: `seed/${p.slug}-${i}.jpg`,
        cdnUrl: `https://picsum.photos/seed/${seed}/800/800`,
        width: 800,
        height: 800,
        alt: `${p.title} - example ${i + 1}`,
        position: i,
        isPrimary: i === 0,
      });
    }

    inserted++;
  }

  const total = await db.select().from(prompts);
  console.log(
    `Done. Inserted ${inserted} new prompts. Total in DB: ${total.length}`,
  );

  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
