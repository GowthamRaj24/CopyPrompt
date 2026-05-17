import { requireAdmin } from "@/server/lib/auth";

/** Runs admin auth once per navigation; paired with layout Suspense + route loading.tsx */
export async function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
