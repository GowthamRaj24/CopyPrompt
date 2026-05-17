import { resendVerificationController } from "@/server/controllers/auth/resend-verification.controller";

export async function POST(req: Request) {
  return resendVerificationController(req);
}
