import { type NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/lib/auth";
import { listSubmissionsPage } from "@/server/services/admin.service";

/**
 * GET /api/admin/queue?status=pending&page=2
 * Paginated submissions for admin queue "Load more".
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const sp = request.nextUrl.searchParams;
  const status =
    sp.get("status") === "approved" || sp.get("status") === "rejected"
      ? sp.get("status")
      : "pending";
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);

  const data = await listSubmissionsPage(
    status as "pending" | "approved" | "rejected",
    page,
  );

  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
