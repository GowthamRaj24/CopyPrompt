import { getCurrentUser } from "@/server/lib/auth";
import { queueCopyIncrement } from "@/server/lib/counter-batcher";
import { recordCopyForUser } from "@/server/services/recent-copies.service";

/**
 * POST /api/prompts/[id]/copy
 *
 * Fire-and-forget telemetry — the client doesn't wait for this response.
 *
 *   1. Push the increment onto the in-memory batcher (debounced 5s flush)
 *      so 100 concurrent copies on a hot prompt become 1 UPDATE.
 *   2. For logged-in users, also persist a row in `prompt_copies`
 *      (per-user timeline). Failures are logged but never thrown.
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

  // Per-user copy history — best effort. Don't block the response.
  void (async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        await recordCopyForUser(user.id, promptId);
      }
    } catch (err) {
      console.error("[copy-controller] history insert failed:", err);
    }
  })();

  return new Response(null, { status: 204 });
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}
