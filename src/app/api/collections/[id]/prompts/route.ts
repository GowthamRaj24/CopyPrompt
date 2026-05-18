import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/lib/auth";
import { PlanLimitError } from "@/server/lib/plan";
import { addPromptToCollection } from "@/server/services/collection.service";

const NO_STORE = { "Cache-Control": "private, no-store" };

interface Context {
  params: Promise<{ id: string }>;
}

const addSchema = z.object({
  promptId: z.string().uuid(),
});

/** POST /api/collections/[id]/prompts — add a prompt to the collection. */
export async function POST(req: NextRequest, ctx: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: NO_STORE },
    );
  }
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "promptId is required" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    await addPromptToCollection(user, id, parsed.data.promptId);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code, upgradeTo: err.upgradeTo },
        { status: 403, headers: NO_STORE },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Collection not found" ? 404 : 400;
    return NextResponse.json(
      { error: message },
      { status, headers: NO_STORE },
    );
  }
}
