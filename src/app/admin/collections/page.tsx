import { FolderIcon } from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/server/lib/auth";
import { listPublicCollectionsForAdmin } from "@/server/services/collection.service";
import { AdminCollectionsTable } from "./components/AdminCollectionsTable";

export const metadata: Metadata = {
  title: "Admin · Collections",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  await requireAdmin();
  const items = await listPublicCollectionsForAdmin(100);

  const curatedCount = items.filter((c) => c.isCurated).length;

  return (
    <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-8 border-b border-border pb-6">
        <p className="eyebrow mb-2 inline-flex items-center gap-1.5">
          <FolderIcon className="size-3" />
          Admin · Collections
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">
          Curate public boards
        </h1>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {items.length} public {items.length === 1 ? "board" : "boards"} ·{" "}
          {curatedCount} marked as curated.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/30 px-6 py-12 text-center text-[13px] text-muted-foreground">
          No public collections yet — users will populate this list once they
          make boards public.
        </p>
      ) : (
        <AdminCollectionsTable initial={items} />
      )}
    </section>
  );
}
