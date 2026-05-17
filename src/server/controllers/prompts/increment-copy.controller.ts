import { queueCopyIncrement } from "@/server/lib/counter-batcher";

/**
 * POST /api/prompts/[id]/copy
 *
 * Fire-and-forget telemetry — the client doesn't wait for this response.
 * We push the increment onto the in-memory batcher (debounced 5s flush)
 * so 100 concurrent copies on a hot prompt become 1 UPDATE, not 100.
 */
export async function incrementCopyController(
  promptId: string,
): Promise<Response> {
  if (!promptId || !isValidUuid(promptId)) {
    return new Response(JSON.stringify({ error: "Invalid prompt id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  queueCopyIncrement(promptId);
  return new Response(null, { status: 204 });
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}
