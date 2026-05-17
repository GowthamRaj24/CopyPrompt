import { signupController } from "@/server/controllers/auth/signup.controller";

export async function POST(req: Request) {
  return signupController(req);
}
