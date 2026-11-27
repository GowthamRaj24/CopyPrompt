import { queueViewIncrement } from "@/server/lib/counter-batcher";

/**
 * POST /api/prompts/[id]/view
 *
 * Client-side view beacon. Prompt pages are now ISR-cached, so the render
 * no longer runs per visit and can't count views itself. The page sends
 * one beacon per prompt per browser session (deduped client-side); bots
 * that don't run JS are no longer counted as views.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return new Response(null, { status: 400 });
  }
  queueViewIncrement(id);
  return new Response(null, { status: 204 });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
