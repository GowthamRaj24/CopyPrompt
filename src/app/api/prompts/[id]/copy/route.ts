import { incrementCopyController } from "@/server/controllers/prompts/increment-copy.controller";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  return incrementCopyController(id);
}
