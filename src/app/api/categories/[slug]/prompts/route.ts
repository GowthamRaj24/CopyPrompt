import { type NextRequest, NextResponse } from "next/server";
import {
  getCategoryBySlug,
  getPromptsByCategoryPage,
} from "@/server/services/category.service";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/categories/[slug]/prompts?page=2&sort=popular
 * Paginated prompts for client "Load more" on category pages.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const sort = sp.get("sort") === "latest" ? "latest" : "popular";

  const category = await getCategoryBySlug(slug);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const data = await getPromptsByCategoryPage({
    categoryId: category.id,
    sort,
    page,
  });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
