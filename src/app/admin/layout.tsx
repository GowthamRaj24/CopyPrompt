import { ShieldIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminAuthLoading } from "@/components/admin/AdminLoading";
import { AdminAuthGate } from "./AdminAuthGate";

// Admin is auth-gated and must not be statically prerendered at build time.
export const dynamic = "force-dynamic";

/**
 * Admin layout — sub-nav renders immediately; auth + page data stream in
 * behind Suspense with route-level loading.tsx skeletons.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Sub-nav */}
      <div className="border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-12 items-center gap-1 px-4 sm:px-6">
          <span className="mr-2 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <ShieldIcon className="size-3" strokeWidth={2.5} />
            Admin
          </span>
          <NavLink href="/admin">Dashboard</NavLink>
          <NavLink href="/admin/queue">Queue</NavLink>
          <NavLink href="/admin/collections">Collections</NavLink>
          <NavLink href="/admin/analytics">Analytics</NavLink>
        </div>
      </div>

      <Suspense fallback={<AdminAuthLoading />}>
        <AdminAuthGate>{children}</AdminAuthGate>
      </Suspense>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
