"use client";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Shown when /admin/analytics fails (usually DB pool timeout in production).
 */
export default function AdminAnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/analytics]", error);
  }, [error]);

  return (
    <section className="container mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertTriangleIcon
          className="mx-auto size-8 text-destructive"
          aria-hidden
        />
        <h1 className="mt-4 text-lg font-semibold tracking-[-0.02em]">
          Analytics could not load
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The dashboard runs several database queries at once. In production
          this usually means the connection pool is too small or the database
          timed out. Set{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[12px]">
            DB_POOL_SIZE=5
          </code>{" "}
          (or higher) in Vercel, then redeploy.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="default" onClick={() => reset()}>
            <RefreshCwIcon className="size-3.5" aria-hidden />
            Try again
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
