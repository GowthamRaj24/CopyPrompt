import { rejectSubmissionController } from "@/server/controllers/admin/reject.controller";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  return rejectSubmissionController(id, req);
}
