import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import { exportUserData } from "@/server/services/account.service";

/**
 * GET /api/account/export
 *
 * Returns a JSON document containing every row in our DB that references
 * the current user. Designed to satisfy GDPR Art. 20 / DPDP §11.
 *
 * The browser receives a Content-Disposition: attachment header so the
 * response opens a "Save as…" dialog instead of rendering in-page.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Not signed in" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const data = await exportUserData(user.id);
    const filename = `mycopyprompt-export-${user.id}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[/api/account/export] failed:", err);
    return NextResponse.json(
      { error: "Could not generate export" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const dynamic = "force-dynamic";
