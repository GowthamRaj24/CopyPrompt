/**
 * Seed the curated prompt catalog from `scripts/data/curated-prompts.json`.
 *
 * Why a JSON file (not inline arrays)
 * ───────────────────────────────────
 *   - Catalog grows over time; editing a 2000-line .ts module is painful.
 *   - JSON is portable — you can hand the file to a contributor without
 *     them needing to understand TypeScript.
 *   - Re-running the script is idempotent (slug-based skip).
 *
 * Run with:
 *   npm run db:seed:curated
 *
 * Re-run any time. Existing prompts (matched by slug) are skipped, so
 * the only cost is a few SELECTs.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { eq, sql as drizzleSql } from "drizzle-orm";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "../src/server/models/category.model";
import { images } from "../src/server/models/image.model";
import { models } from "../src/server/models/model.model";
import { promptTags } from "../src/server/models/prompt-tag.model";
import { prompts } from "../src/server/models/prompt.model";
import { tags } from "../src/server/models/tag.model";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

interface CuratedPrompt {
  type: "image" | "text";
  slug: string;
  title: string;
  promptText: string;
  modelSlug: string;
  categorySlug: string;
  tags: string[];
  tips?: string;
  // Image-only
  imageSeeds?: string[];
  negativePrompt?: string;
  // Text-only
  expectedOutcome?: string;
  // Shared optional model params
  params?: Record<string, unknown>;
}

const DATA_DIR = resolve(process.cwd(), "scripts", "data");

/**
 * Discover every curated-prompt data file in /scripts/data.
 * Picks up:
 *   - curated-prompts.json            (original catalog)
 *   - curated-prompts-extra-*.json    (expansion packs, alphabetically)
 *
 * Each pack is independent — slugs are deduped against the DB at insert,
 * so packs can ship piecemeal as 100-prompt batches.
 */
function listDataFiles(): string[] {
  return readdirSync(DATA_DIR)
    .filter(
      (f) =>
        f === "curated-prompts.json" ||
        (f.startsWith("curated-prompts-extra-") && f.endsWith(".json")),
    )
    .sort()
    .map((f) => join(DATA_DIR, f));
}

const pg = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(pg);

/**
 * Build a stable HTTPS placeholder image URL from a seed string.
 * Picsum keeps the same image for the same seed, so the catalog
 * is visually consistent across re-seeds.
 */
function picsumUrl(seed: string, size = 800): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${size}/${size}`;
}

async function main() {
  const files = listDataFiles();
  console.log(`→ Reading ${files.length} curated catalog file(s):`);
  const data: CuratedPrompt[] = [];
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as CuratedPrompt[];
    console.log(`  • ${file.split(/[\\/]/).pop()} → ${parsed.length} prompts`);
    data.push(...parsed);
  }
  console.log(`  ✓ Parsed ${data.length} prompts across ${files.length} file(s)`);

  // Resolve all model + category slugs upfront so we don't hit the DB
  // for every row. One pass, one cache.
  console.log("→ Loading model / category maps…");
  const allModels = await db.select().from(models);
  const allCategories = await db.select().from(categories);
  const modelBySlug = new Map(allModels.map((m) => [m.slug, m.id]));
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));
  console.log(
    `  ✓ ${allModels.length} models, ${allCategories.length} categories`,
  );

  let inserted = 0;
  let skipped = 0;
  let invalid = 0;

  for (const p of data) {
    const modelId = modelBySlug.get(p.modelSlug);
    const categoryId = categoryBySlug.get(p.categorySlug);

    if (!modelId) {
      console.warn(
        `  ⚠ ${p.slug}: model "${p.modelSlug}" not found — run db:seed first. Skipping.`,
      );
      invalid++;
      continue;
    }
    if (!categoryId) {
      console.warn(
        `  ⚠ ${p.slug}: category "${p.categorySlug}" not found — run db:seed first. Skipping.`,
      );
      invalid++;
      continue;
    }

    // Idempotency: skip if already inserted.
    const existing = await db
      .select({ id: prompts.id })
      .from(prompts)
      .where(eq(prompts.slug, p.slug))
      .limit(1);
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    // Insert the prompt. Engagement counters intentionally NOT set,
    // so they default to 0 and accumulate from real user activity.
    const [newPrompt] = await db
      .insert(prompts)
      .values({
        slug: p.slug,
        title: p.title,
        promptText: p.promptText,
        negativePrompt: p.negativePrompt ?? null,
        expectedOutcome: p.expectedOutcome ?? null,
        modelId,
        categoryId,
        params: p.params ?? {},
        tips: p.tips ?? null,
        status: "published",
      })
      .returning({ id: prompts.id });

    if (!newPrompt) continue;

    // Insert placeholder images for image-type prompts.
    if (p.type === "image" && p.imageSeeds && p.imageSeeds.length > 0) {
      await db.insert(images).values(
        p.imageSeeds.map((seed, idx) => ({
          promptId: newPrompt.id,
          r2Key: `seed/${p.slug}-${idx}.jpg`,
          cdnUrl: picsumUrl(seed),
          width: 800,
          height: 800,
          alt: `${p.title} — example ${idx + 1}`,
          position: idx,
          isPrimary: idx === 0,
        })),
      );
    }

    // Upsert tags + insert junctions. Same logic as the admin-approval
    // flow so curated prompts feel identical to community-submitted ones.
    for (const tagSlug of p.tags ?? []) {
      const [tag] = await db
        .insert(tags)
        .values({
          slug: tagSlug,
          name: tagSlug.replace(/-/g, " "),
          usageCount: 1,
        })
        .onConflictDoUpdate({
          target: tags.slug,
          set: { usageCount: drizzleSql`${tags.usageCount} + 1` },
        })
        .returning({ id: tags.id });
      if (tag) {
        await db
          .insert(promptTags)
          .values({ promptId: newPrompt.id, tagId: tag.id })
          .onConflictDoNothing();
      }
    }

    inserted++;
  }

  const totalRows = await db.select({ id: prompts.id }).from(prompts);

  console.log("\n────────── SUMMARY ──────────");
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Skipped  : ${skipped} (already in DB)`);
  console.log(`  Invalid  : ${invalid} (missing model/category)`);
  console.log(`  Total prompts in DB now: ${totalRows.length}`);
  console.log("\n✓ Curated catalog seed complete.");
}

main()
  .catch((err) => {
    console.error("\n✗ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pg.end();
  });
