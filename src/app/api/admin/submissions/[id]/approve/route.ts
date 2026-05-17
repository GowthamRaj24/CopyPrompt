import { approveSubmissionController } from "@/server/controllers/admin/approve.controller";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  return approveSubmissionController(id);
}
