import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { publicPublishedWhere } from "@/lib/prompt-visibility";
import { db } from "@/server/lib/db";
import { categories } from "@/server/models/category.model";
import { models } from "@/server/models/model.model";
import { prompts } from "@/server/models/prompt.model";

const CACHE = { "Cache-Control": "public, max-age=60, s-maxage=300" };

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/prompts/[id]/remix-source
 *
 * Returns sanitized fields needed to seed the submit form when a remix
 * is initiated from outside the normal `/submit?remix_from=<slug>` route
 * (e.g. a browser extension or third-party integration).
 *
 * Accepts either a UUID or a slug as `id`. Only public, published prompts.
 */
export async function GET(_req: NextRequest, ctx: Context) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const idCondition = isUuid ? eq(prompts.id, id) : eq(prompts.slug, id);

  const [row] = await db
    .select({
      id: prompts.id,
      slug: prompts.slug,
      title: prompts.title,
      promptText: prompts.promptText,
      negativePrompt: prompts.negativePrompt,
      expectedOutcome: prompts.expectedOutcome,
      tips: prompts.tips,
      params: prompts.params,
      modelSlug: models.slug,
      modelName: models.name,
      modelType: models.type,
      categorySlug: categories.slug,
    })
    .from(prompts)
    .innerJoin(models, eq(models.id, prompts.modelId))
    .innerJoin(categories, eq(categories.id, prompts.categoryId))
    .where(and(idCondition, publicPublishedWhere()))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      source: {
        id: row.id,
        slug: row.slug,
        title: row.title,
        promptText: row.promptText,
        negativePrompt: row.negativePrompt,
        expectedOutcome: row.expectedOutcome,
        tips: row.tips,
        params: row.params,
        modelSlug: row.modelSlug,
        modelName: row.modelName,
        modelType: row.modelType as "image" | "text",
        categorySlug: row.categorySlug,
      },
    },
    { headers: CACHE },
  );
}
