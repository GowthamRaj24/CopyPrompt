import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/server/lib/auth";
import { publishPrivateToCatalog } from "@/server/services/private-prompt.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;
  try {
    const { slug } = await publishPrivateToCatalog(id, user.id);
    revalidatePath("/");
    revalidatePath(`/prompt/${slug}`);
    revalidatePath("/search");
    // Bust the per-query `unstable_cache` wrappers on the homepage
    // (rails / categories / counts) so the newly published prompt
    // appears immediately rather than at the next revalidation.
    // Next 16 requires a cache-life profile; `expire: 0` = invalidate now.
    revalidateTag("home", { expire: 0 });
    return new Response(JSON.stringify({ slug, url: `/prompt/${slug}` }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
