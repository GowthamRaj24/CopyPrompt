import { getAllGuideSlugs } from "@/lib/guides/content";
import { publicPublishedWhere } from "@/lib/prompt-visibility";
import type { MetadataRoute } from "next";
import { db } from "@/server/lib/db";
import { getIndexableCategorySlugs } from "@/server/services/category.service";
import { prompts } from "@/server/models/prompt.model";
import { getIndexableCollectionSlugs } from "@/server/services/collection.service";
import { listIndexableCreatorHandles } from "@/server/services/creator.service";
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

const QUERY_TIMEOUT_MS = 15_000;

async function safeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  // Hard-bound each lookup so a single slow / hung query never starves
  // the 60s budget Next allocates to the sitemap worker.
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(
      () => reject(new Error(`${label} timed out after ${QUERY_TIMEOUT_MS}ms`)),
      QUERY_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([fn(), timeout]);
  } catch (err) {
    console.error(`[sitemap] ${label} failed:`, err);
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    promptRows,
    categoryRows,
    tagRows,
    modelRows,
    collectionSlugs,
    creatorHandles,
  ] = await Promise.all([
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
      () => getIndexableCategorySlugs(),
      [],
    ),
    safeQuery("tags", () => getAllTagSlugsForSitemap(), []),
    safeQuery("models", () => getIndexableModels(), []),
    safeQuery(
      "collections",
      () => getIndexableCollectionSlugs(),
      [] as string[],
    ),
    safeQuery(
      "creators",
      () => listIndexableCreatorHandles(),
      [] as string[],
    ),
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
      url: `${BASE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35,
    },
    {
      url: `${BASE_URL}/generate`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contributors`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.65,
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

  const collectionRoutes: MetadataRoute.Sitemap = collectionSlugs.map(
    (slug) => ({
      url: `${BASE_URL}/c/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  const creatorRoutes: MetadataRoute.Sitemap = creatorHandles.map((handle) => ({
    url: `${BASE_URL}/u/${handle}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.55,
  }));

  const guideRoutes: MetadataRoute.Sitemap = getAllGuideSlugs().map((slug) => ({
    url: `${BASE_URL}/guides/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [
    ...staticRoutes,
    ...guideRoutes,
    ...categoryRoutes,
    ...modelRoutes,
    ...tagRoutes,
    ...collectionRoutes,
    ...creatorRoutes,
    ...promptRoutes,
  ];
}
