import {
  getRatingController,
  rateController,
} from "@/server/controllers/ratings/rate.controller";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: Context) {
  return getRatingController(req, context);
}

export async function POST(req: Request, context: Context) {
  return rateController(req, context);
}
