import { ArrowLeftIcon, DownloadIcon, ShieldAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/lib/auth";
import { DangerZoneForms } from "./components/DangerZoneForms";

export const metadata: Metadata = {
  title: "Danger zone",
  description: "Export your data or permanently delete your account.",
  robots: { index: false, follow: false },
};

/**
 * /account/danger-zone
 *
 * One screen for both legally-required user controls:
 *   • Export — GDPR Art. 20 / DPDP §11
 *   • Delete — GDPR Art. 17 / DPDP §12
 *
 * Visual language is deliberately heavier than the rest of the app
 * (red accents, dotted dividers, plain-English consequences) so users
 * cannot click "delete" by accident.
 */
export default async function DangerZonePage() {
  const user = await requireUser();
  const isAdmin = user.plan === "admin";

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-50"
      />
      <div className="container relative mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-14">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to account
        </Link>

        <header className="mb-10 mt-4 border-b border-border pb-6 md:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-destructive">
            <ShieldAlertIcon className="size-3" strokeWidth={2.5} />
            Danger zone
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Take your data — or wipe it
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
            Signed in as{" "}
            <span className="text-foreground">{user.email}</span>. Both
            actions below are immediate. There&apos;s no &ldquo;30-day
            recovery&rdquo; window.
          </p>
        </header>

        {/* Export — pleasant, neutral surface */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <DownloadIcon className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold tracking-[-0.005em]">
                Download your data
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                A single JSON file with your profile, submissions, authored
                prompts, favorites, and ratings. Nothing else leaves the
                platform.
              </p>
            </div>
          </div>
          {/* Action lives in the client island below */}
          <DangerZoneForms isAdmin={isAdmin} email={user.email} />
        </div>

        {/* Admin warning (delete is forbidden for admins to prevent lockout) */}
        {isAdmin && (
          <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-300">
            You&apos;re an admin. Account deletion is disabled for safety. To
            delete this account, ask another admin to demote you to a free
            plan first.
          </p>
        )}
      </div>
    </section>
  );
}
