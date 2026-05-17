import {
  ChevronRightIcon,
  HeartIcon,
  LogOutIcon,
  PlusIcon,
  ShieldAlertIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buildShareUrl } from "@/lib/share-token";
import { SITE_BRAND } from "@/lib/site-brand";
import { requireUser } from "@/server/lib/auth";
import { listOwnedPrompts } from "@/server/services/private-prompt.service";
import { MyPromptsSection } from "./components/MyPromptsSection";

export const metadata: Metadata = {
  title: "Account",
  description: `Manage your ${SITE_BRAND.displayName} account, prompts, and settings.`,
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser();
  const rows = await listOwnedPrompts(user.id);

  const prompts = rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    visibility: p.visibility,
    status: p.status,
    copyCount: p.copyCount,
    createdAt: p.createdAt.toISOString(),
    shareUrl: p.shareToken ? buildShareUrl(p.shareToken) : null,
    publicUrl: p.visibility === "public" ? `/prompt/${p.slug}` : null,
  }));

  const privateCount = prompts.filter((p) => p.visibility === "private").length;
  const publicCount = prompts.filter((p) => p.visibility === "public").length;
  const totalCopies = prompts.reduce((sum, p) => sum + p.copyCount, 0);

  const initials = (user.fullName ?? user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <section className="relative min-h-[80svh] w-full">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[min(60vh,640px)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="relative mx-auto w-full px-5 py-8 sm:px-8 md:py-10 lg:px-10 xl:px-12 2xl:px-14">
        {/* Page header — full width */}
        <header className="reveal mb-8 flex flex-col gap-6 border-b border-border/50 pb-8 md:mb-10 md:flex-row md:items-end md:justify-between md:pb-10">
          <div>
            <p className="eyebrow mb-2 text-sm tracking-widest">Account</p>
            <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Manage your prompts, share links, and account settings — all in one
              place.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="press h-12 shrink-0 gap-2 rounded-xl px-6 text-base font-semibold"
          >
            <Link href="/submit">
              <PlusIcon className="size-5" />
              New prompt
            </Link>
          </Button>
        </header>

        {/* Stats strip — full width */}
        <div className="reveal delay-1 mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:mb-10">
          <MetricCard label="Total prompts" value={prompts.length} />
          <MetricCard label="Private" value={privateCount} accent="violet" />
          <MetricCard label="Public" value={publicCount} accent="emerald" />
          <MetricCard label="Total copies" value={totalCopies} />
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-[minmax(300px,360px)_1fr] lg:gap-8 xl:gap-10">
          {/* Sidebar */}
          <aside className="reveal delay-2 space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              <div className="border-b border-border/40 bg-gradient-to-br from-primary/[0.1] via-primary/[0.03] to-transparent p-6 sm:p-7">
                <div className="flex items-center gap-5">
                  <Avatar className="size-16 ring-2 ring-primary/25 ring-offset-2 ring-offset-card sm:size-[4.5rem]">
                    {user.avatarUrl && (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.fullName ?? user.email}
                      />
                    )}
                    <AvatarFallback className="bg-primary/15 text-xl font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-1 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
                      {user.fullName ?? "Member"}
                    </h2>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground sm:text-base">
                      {user.email}
                    </p>
                    <div className="mt-3">
                      {user.plan === "admin" ? (
                        <PlanBadge variant="admin">Admin</PlanBadge>
                      ) : user.plan === "premium" ? (
                        <PlanBadge variant="premium">Premium</PlanBadge>
                      ) : (
                        <PlanBadge variant="free">Free</PlanBadge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <nav className="p-3">
                <NavRow
                  href="/favorites"
                  icon={<HeartIcon className="size-5" />}
                  label="Favorites"
                  hint="Saved prompts"
                />
                <NavRow
                  href="/submit"
                  icon={<PlusIcon className="size-5" />}
                  label="Submit prompt"
                  hint="Public or private"
                />
                <NavRow
                  href="/account#my-prompts"
                  icon={<SparklesIcon className="size-5" />}
                  label="My prompts"
                  hint={`${prompts.length} total`}
                  active
                />
              </nav>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 sm:p-6">
              <h3 className="text-base font-semibold sm:text-lg">Session</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Sign out on shared devices when you&apos;re finished.
              </p>
              <form action="/auth/signout" method="post" className="mt-4">
                <Button
                  type="submit"
                  variant="outline"
                  className="press h-11 w-full gap-2 text-base"
                >
                  <LogOutIcon className="size-4" />
                  Sign out
                </Button>
              </form>
            </div>

            <Link
              href="/account/danger-zone"
              className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card/40 px-5 py-4 transition-colors hover:border-destructive/30 hover:bg-destructive/[0.04] sm:px-6 sm:py-5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlertIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium group-hover:text-destructive sm:text-lg">
                  Privacy & data
                </p>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Export or delete your account
                </p>
              </div>
              <ChevronRightIcon className="size-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-destructive" />
            </Link>
          </aside>

          {/* Main — My prompts (full remaining width) */}
          <div className="reveal delay-3 min-w-0">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-soft sm:p-7 md:p-8 lg:p-10">
              <MyPromptsSection initialPrompts={prompts} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "violet" | "emerald";
}) {
  const accentStyles = {
    violet: "border-violet-500/20 bg-violet-500/[0.06]",
    emerald: "border-emerald-500/20 bg-emerald-500/[0.06]",
  };

  return (
    <div
      className={`rounded-2xl border border-border/60 bg-card/60 px-4 py-4 sm:px-5 sm:py-5 ${
        accent ? accentStyles[accent] : ""
      }`}
    >
      <p className="font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function PlanBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "admin" | "premium" | "free";
}) {
  const styles = {
    admin: "border-primary/30 bg-primary/10 text-primary",
    premium:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    free: "border-border bg-background text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider sm:text-sm ${styles[variant]}`}
    >
      {variant === "admin" && (
        <ShieldIcon className="size-3" strokeWidth={2.5} />
      )}
      {children}
    </span>
  );
}

function NavRow({
  href,
  icon,
  label,
  hint,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors sm:py-4 ${
        active
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/50"
      }`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-lg border transition-colors sm:size-11 ${
          active
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-border/50 bg-background/80 text-primary group-hover:border-primary/30 group-hover:bg-primary/10"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-base font-medium sm:text-lg ${
            active ? "text-primary" : "text-foreground"
          }`}
        >
          {label}
        </p>
        <p className="text-sm text-muted-foreground sm:text-base">{hint}</p>
      </div>
      <ChevronRightIcon
        className={`size-5 transition-transform group-hover:translate-x-0.5 ${
          active
            ? "text-primary/60"
            : "text-muted-foreground/30 group-hover:text-foreground"
        }`}
      />
    </Link>
  );
}
