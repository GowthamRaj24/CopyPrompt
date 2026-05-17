import { z } from "zod";
import { requireAdmin } from "@/server/lib/auth";
import { rejectSubmission } from "@/server/services/admin.service";
import { rejectSubmissionSchema } from "@/server/validators/admin.validator";

/**
 * POST /api/admin/submissions/[id]/reject
 * Body: { reason: string }
 */
export async function rejectSubmissionController(
  submissionId: string,
  req: Request,
): Promise<Response> {
  const admin = await requireAdmin();

  if (!isValidUuid(submissionId)) {
    return jsonError("Invalid submission id", 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = rejectSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        issues: z.treeifyError(parsed.error),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    await rejectSubmission(submissionId, admin.id, parsed.data.reason);
    return new Response(null, { status: 204 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not reject submission";
    return jsonError(message, 500);
  }
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
