import { createPrivatePromptController } from "@/server/controllers/prompts/create-private.controller";

export async function POST(req: Request) {
  return createPrivatePromptController(req);
}
