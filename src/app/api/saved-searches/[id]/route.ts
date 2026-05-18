import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import { deleteSavedSearch } from "@/server/services/saved-search.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

interface Context {
  params: Promise<{ id: string }>;
}

/** DELETE /api/saved-searches/[id] — remove an alert. */
export async function DELETE(_req: NextRequest, ctx: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  const { id } = await ctx.params;
  await deleteSavedSearch(user.id, id);
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
