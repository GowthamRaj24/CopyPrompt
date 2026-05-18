import { type NextRequest, NextResponse } from "next/server";
import {
  getModelBySlug,
  getPromptsByModelPage,
} from "@/server/services/model-catalog.service";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/** GET /api/models/[slug]/prompts?page=2&sort=popular */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const sort = sp.get("sort") === "latest" ? "latest" : "popular";

  const model = await getModelBySlug(slug);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const data = await getPromptsByModelPage({ modelId: model.id, sort, page });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
