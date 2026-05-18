import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/lib/auth";
import { removePromptFromCollection } from "@/server/services/collection.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

interface Context {
  params: Promise<{ id: string; promptId: string }>;
}

/** DELETE /api/collections/[id]/prompts/[promptId] — remove a prompt from collection. */
export async function DELETE(_req: NextRequest, ctx: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }

  const { id, promptId } = await ctx.params;

  try {
    await removePromptFromCollection(user, id, promptId);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Collection not found" ? 404 : 400;
    return NextResponse.json(
      { error: message },
      { status, headers: NO_STORE },
    );
  }
}
