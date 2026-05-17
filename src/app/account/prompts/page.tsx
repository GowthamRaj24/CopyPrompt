import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/lib/auth";
import { listOwnedPrompts } from "@/server/services/private-prompt.service";
import { buildShareUrl } from "@/lib/share-token";
import { MyPromptsClient } from "./MyPromptsClient";

export const metadata: Metadata = {
  title: "My prompts",
  robots: { index: false, follow: false },
};

export default async function MyPromptsPage() {
  const user = await requireUser();
  const rows = await listOwnedPrompts(user.id);

  const prompts = rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    visibility: p.visibility,
    status: p.status,
    copyCount: p.copyCount,
    shareUrl: p.shareToken ? buildShareUrl(p.shareToken) : null,
    publicUrl: p.visibility === "public" ? `/prompt/${p.slug}` : null,
  }));

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
      />
      <div className="container relative mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-14">
        <header className="mb-8 border-b border-border pb-6">
          <p className="eyebrow mb-2">Account</p>
          <h1 className="text-3xl font-bold tracking-[-0.02em]">My prompts</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Manage private share links or publish to the public catalog.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-flex text-[13px] font-medium text-primary hover:underline"
          >
            Submit another prompt →
          </Link>
        </header>
        <MyPromptsClient initialPrompts={prompts} />
      </div>
    </section>
  );
}
