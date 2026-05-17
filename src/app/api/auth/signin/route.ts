import { signinController } from "@/server/controllers/auth/signin.controller";

export async function POST(req: Request) {
  return signinController(req);
}
