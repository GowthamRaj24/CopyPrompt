"use client";

import { usePathname } from "next/navigation";

/**
 * Routes where the wrapped chrome (Header / Footer) should NOT render.
 * Auth pages get full-screen treatment via AuthLayout.
 */
const AUTH_PATHS = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

/**
 * Client wrapper that hides its children on auth routes.
 *
 * Next.js allows server components (like our async Header/Footer) to be
 * passed as `children` to a client component. The client component reads
 * the pathname and decides whether to render — usePathname is reliable
 * and doesn't depend on custom request headers.
 */
export function HiddenOnAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthPage) return null;
  return <>{children}</>;
}
