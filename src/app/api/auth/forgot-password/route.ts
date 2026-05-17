import { forgotPasswordController } from "@/server/controllers/auth/forgot-password.controller";

export async function POST(req: Request) {
  return forgotPasswordController(req);
}
