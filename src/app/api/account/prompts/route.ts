import { getCurrentUser } from "@/server/lib/auth";
import { listOwnedPrompts } from "@/server/services/private-prompt.service";
import { buildShareUrl } from "@/lib/share-token";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = await listOwnedPrompts(user.id);
  return new Response(
    JSON.stringify({
      prompts: rows.map((p) => ({
        ...p,
        shareUrl: p.shareToken ? buildShareUrl(p.shareToken) : null,
      })),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    },
  );
}
