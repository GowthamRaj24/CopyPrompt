import { resetPasswordController } from "@/server/controllers/auth/reset-password.controller";

export async function POST(req: Request) {
  return resetPasswordController(req);
}
