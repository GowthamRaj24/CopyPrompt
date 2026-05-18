import { publicPublishedWhere } from "@/lib/prompt-visibility";
import type { MetadataRoute } from "next";
import { db } from "@/server/lib/db";
import { categories } from "@/server/models/category.model";
import { prompts } from "@/server/models/prompt.model";
import { getAllTagSlugsForSitemap } from "@/server/services/tag.service";
import { getIndexableModels } from "@/server/services/model-catalog.service";

/**
 * Dynamic sitemap.
 *
 * Lists every published prompt + every category + static pages.
 * Generated at build time and revalidated every 6 hours.
 *
 * Google supports up to 50,000 URLs per sitemap. We split when we exceed
 * ~40k (not yet — single sitemap is fine).
 */
export const revalidate = 21600; // 6 hours

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[sitemap] ${label} failed:`, err);
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [promptRows, categoryRows, tagRows, modelRows] = await Promise.all([
    safeQuery("prompts", () =>
      db
        .select({
          slug: prompts.slug,
          updatedAt: prompts.updatedAt,
        })
        .from(prompts)
        .where(publicPublishedWhere()),
      [],
    ),
    safeQuery(
      "categories",
      () => db.select({ slug: categories.slug }).from(categories),
      [],
    ),
    safeQuery("tags", () => getAllTagSlugsForSitemap(), []),
    safeQuery("models", () => getIndexableModels(), []),
  ]);

  // ─── Static pages ──────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/models`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/search?type=image`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/search?type=text`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // ─── Categories ────────────────────────────────────────
  const categoryRoutes: MetadataRoute.Sitemap = categoryRows.map((c) => ({
    url: `${BASE_URL}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // ─── Prompts ───────────────────────────────────────────
  const promptRoutes: MetadataRoute.Sitemap = promptRows.map((p) => ({
    url: `${BASE_URL}/prompt/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tagRows.map((t) => ({
    url: `${BASE_URL}/tag/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.55,
  }));

  const modelRoutes: MetadataRoute.Sitemap = modelRows.map((m) => ({
    url: `${BASE_URL}/models/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...modelRoutes,
    ...tagRoutes,
    ...promptRoutes,
  ];
}
