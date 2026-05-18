import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/lib/auth";
import {
  getAdminTotals,
  getDailyFavorites,
  getDailyPulse,
  getDailySignups,
  getDailySubmissions,
  getTopCategories,
  getTopModels,
  getTopTags,
} from "@/server/services/analytics.service";

const SECTIONS = ["pulse", "totals", "trends", "catalog"] as const;
type Section = (typeof SECTIONS)[number];

function isSection(value: string | null): value is Section {
  return SECTIONS.includes(value as Section);
}

/**
 * GET /api/admin/analytics?section=pulse|totals|trends|catalog
 * On-demand analytics blocks for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const section = request.nextUrl.searchParams.get("section");
  if (!isSection(section)) {
    return NextResponse.json(
      { error: "Invalid section. Use pulse, totals, trends, or catalog." },
      { status: 400 },
    );
  }

  let data: unknown;

  switch (section) {
    case "pulse":
      data = await getDailyPulse();
      break;
    case "totals":
      data = await getAdminTotals();
      break;
    case "trends":
      data = {
        signupsSeries: await getDailySignups(30),
        submissionsSeries: await getDailySubmissions(30),
        favoritesSeries: await getDailyFavorites(30),
      };
      break;
    case "catalog":
      data = {
        topCategories: await getTopCategories(8),
        topTags: await getTopTags(12),
        topModels: await getTopModels(8),
      };
      break;
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
