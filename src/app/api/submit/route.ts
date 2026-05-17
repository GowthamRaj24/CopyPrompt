import { createSubmissionController } from "@/server/controllers/submissions/create.controller";

export async function POST(req: Request) {
  return createSubmissionController(req);
}
