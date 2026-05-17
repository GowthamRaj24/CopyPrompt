import { requireAdmin } from "@/server/lib/auth";
import { approveSubmission } from "@/server/services/admin.service";

/**
 * POST /api/admin/submissions/[id]/approve
 *
 * Approves the submission, creating the prompt + images + tags atomically.
 * Returns 401 if not signed in, 403 if not admin.
 */
export async function approveSubmissionController(
  submissionId: string,
): Promise<Response> {
  const admin = await requireAdmin();

  if (!isValidUuid(submissionId)) {
    return jsonError("Invalid submission id", 400);
  }

  try {
    const { slug } = await approveSubmission(submissionId, admin.id);
    return new Response(JSON.stringify({ slug }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not approve submission";
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
