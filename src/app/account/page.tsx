import {
  ChevronRightIcon,
  HeartIcon,
  LogOutIcon,
  PlusIcon,
  ShieldAlertIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
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
  const totalCopies = prompts.reduce((sum, p) => sum + p.copyCount, 0);

  const initials = (user.fullName ?? user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <section className="relative">
      <div
        aria-hidden
        className="bg-spotlight-top pointer-events-none absolute inset-x-0 top-0 h-[460px]"
      />

      <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
        <header className="reveal delay-1 mb-10 flex flex-col gap-4 border-b border-border pb-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2">Account</p>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary md:size-12">
                <UserIcon
                  className="size-4 md:size-5"
                  strokeWidth={2}
                />
              </span>
              Dashboard
            </h1>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {prompts.length === 0
                ? "No prompts yet — submit your first one"
                : `${prompts.length} prompt${prompts.length === 1 ? "" : "s"} · ${privateCount} private · ${totalCopies.toLocaleString()} copies`}
            </p>
          </div>
          <Link
            href="/submit"
            className="press inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-md border border-border bg-card px-3 text-[13px] font-medium transition-all hover:border-foreground/30 hover:bg-muted md:self-auto"
          >
            <PlusIcon className="size-3.5" />
            New prompt
          </Link>
        </header>

        {/* Same max width as /submit two-column layout */}
        <div className="mx-auto grid max-w-[1080px] gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="reveal delay-2 space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
              <div className="border-b border-border/40 bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                    {user.avatarUrl && (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.fullName ?? user.email}
                      />
                    )}
                    <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-1 text-[16px] font-semibold tracking-[-0.02em]">
                      {user.fullName ?? "Member"}
                    </h2>
                    <p className="line-clamp-1 text-[12px] text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-2">
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

              <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/40">
                <StatCell label="Prompts" value={prompts.length} />
                <StatCell label="Private" value={privateCount} />
                <StatCell label="Copies" value={totalCopies} />
              </div>

              <nav className="p-2">
                <NavRow
                  href="/favorites"
                  icon={<HeartIcon className="size-4" />}
                  label="Favorites"
                  hint="Saved prompts"
                />
                <NavRow
                  href="/submit"
                  icon={<PlusIcon className="size-4" />}
                  label="Submit prompt"
                  hint="Public or private"
                />
                <NavRow
                  href="/account#my-prompts"
                  icon={<SparklesIcon className="size-4" />}
                  label="My prompts"
                  hint={`${prompts.length} total`}
                  active
                />
              </nav>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <h3 className="text-[13px] font-semibold">Session</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Sign out on shared devices after you&apos;re done.
              </p>
              <form action="/auth/signout" method="post" className="mt-3">
                <Button
                  type="submit"
                  variant="outline"
                  className="press h-9 w-full gap-2 text-[12px]"
                >
                  <LogOutIcon className="size-3.5" />
                  Sign out
                </Button>
              </form>
            </div>

            <Link
              href="/account/danger-zone"
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 px-4 py-3 transition-colors hover:border-destructive/30 hover:bg-destructive/[0.03]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <ShieldAlertIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium group-hover:text-destructive">
                  Privacy & data
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Export or delete account
                </p>
              </div>
              <ChevronRightIcon className="size-4 text-muted-foreground/40 group-hover:text-destructive" />
            </Link>
          </aside>

          <div className="reveal delay-3 min-w-0">
            <div className="rounded-xl border border-border/60 bg-card/30 p-4 shadow-soft sm:p-6 md:p-8">
              <MyPromptsSection initialPrompts={prompts} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2 py-3 text-center">
      <p className="font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
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
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[variant]}`}
    >
      {variant === "admin" && (
        <ShieldIcon className="size-2.5" strokeWidth={2.5} />
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
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        active ? "bg-primary/10" : "hover:bg-muted/50"
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-md border transition-colors ${
          active
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-border/50 bg-background/80 text-primary group-hover:border-primary/30 group-hover:bg-primary/10"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-medium ${
            active ? "text-primary" : "text-foreground"
          }`}
        >
          {label}
        </p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <ChevronRightIcon
        className={`size-4 transition-transform group-hover:translate-x-0.5 ${
          active
            ? "text-primary/60"
            : "text-muted-foreground/30 group-hover:text-foreground"
        }`}
      />
    </Link>
  );
}
